import {Response} from 'express';
import {ArgumentsHost, Catch, ExceptionFilter, HttpException} from '@nestjs/common';
import {ExceptionResponse} from '../../domain/exception.response';
import {HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost} from '@nestjs/common/interfaces';
import {Exception} from '../../domain/exception';
import {Socket} from 'socket.io';
import {SharedEventsConstants} from '../../domain/shared-events.constants';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
    public static resolveMessage(exception): string {
        if (typeof exception === 'object') {
            if (exception.response?.message) {
                if (Array.isArray(exception.response.message)) {
                    return exception.response.message.join(', ');
                } else if (typeof exception.response.message === 'string') {
                    return exception.response.message;
                }
            } else if (exception.message && typeof exception.message == 'string') {
                return exception.message;
            }
        }
        if (typeof exception === 'string') {
            return exception;
        }
        return null;
    }

    catch(exception: Error, host: ArgumentsHost): void {
        if (exception instanceof Exception) {
            this.setExceptionResponse(host, ExceptionResponse.fromExceptionBase(exception));
        } else {
            const response: ExceptionResponse = new ExceptionResponse();
            response.setMessage(AppExceptionFilter.resolveMessage(exception));
            response.setStatus(exception instanceof HttpException ? exception.getStatus() : null);
            this.setExceptionResponse(host, response);
        }
    }

    private setExceptionResponse(
        host: ArgumentsHost,
        exceptionResponse: ExceptionResponse
    ): void {
        let context: RpcArgumentsHost | HttpArgumentsHost | WsArgumentsHost;
        let response: Response;
        switch (host.getType()) {
        case 'http':
            context = host.switchToHttp();
            response = context.getResponse<Response>();
            response.status(exceptionResponse.code).json(exceptionResponse);
            break;
        case 'ws':
            context = host.switchToWs();
            context.getClient<Socket>().emit(SharedEventsConstants.EVENT_ERROR, exceptionResponse);
            break;
        }
    }
}
