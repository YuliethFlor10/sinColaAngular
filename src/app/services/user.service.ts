import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    console.log('Registrando usuario con', this.apiUrl + '/register:', userData);

    // Asegurar que los datos tienen el formato correcto
    const formattedData = {
      nombres: userData.nombres || userData.firstName || '',
      apellidos: userData.apellidos || userData.lastName || '',
      email: userData.email || '',
      password: userData.clave || userData.password || '', // Mapear 'clave' a 'password'
      celular: userData.celular || userData.phone || '',
      roles_id: userData.roles_id || userData.roleId || 2, // Cliente por defecto
      negocios_id: userData.negocios_id || userData.businessId || 1
    };

    console.log('Datos formateados:', formattedData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/register`, formattedData, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en registro:', error);
          return throwError(error);
        })
      );
  }
}
