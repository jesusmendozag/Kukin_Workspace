package com.naatlabs.kukin.exception;

import com.naatlabs.kukin.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Collections;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(KukinApiException.class)
    public ResponseEntity<ErrorResponse> handleKukinApiException(KukinApiException ex) {
        ErrorResponse body = new ErrorResponse(ex.getCode(), ex.getMessage(), Collections.emptyList());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult()
                .getAllErrors()
                .stream()
                .map(error -> {
                    if (error instanceof FieldError fieldError) {
                        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
                    }
                    return error.getDefaultMessage();
                })
                .toList();

        ErrorResponse body = new ErrorResponse(
                "VALIDATION_ERROR",
                "Uno o más campos tienen formato inválido o están vacíos",
                details
        );
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    /** JSON mal formado o tipos inválidos (por ejemplo, una fecha que no es AAAA-MM-DD). */
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        ErrorResponse body = new ErrorResponse(
                "BAD_REQUEST",
                "La petición tiene un formato inválido",
                Collections.emptyList()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoResourceFoundException ex) {
        ErrorResponse body = new ErrorResponse("NOT_FOUND", "Recurso no encontrado", Collections.emptyList());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        ErrorResponse body = new ErrorResponse("METHOD_NOT_ALLOWED", "Método no permitido", Collections.emptyList());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        // El detalle técnico se queda en el log del servidor, no se expone al cliente
        log.error("Error no controlado", ex);
        ErrorResponse body = new ErrorResponse(
                "INTERNAL_SERVER_ERROR",
                "Ocurrió un error inesperado en el servidor",
                Collections.emptyList()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
