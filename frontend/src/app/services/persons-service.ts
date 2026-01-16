import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Persons } from '../persons';

@Injectable({
  providedIn: 'root'
})
export class PersonsService {
  domain: string = "http://localhost:3000"
  apiRoute: string = "/api/persons"

  constructor(private http: HttpClient) { }

  getAll(){
    var api = this.domain + this.apiRoute;
    return this.http.get<Persons[]>(api);
  }
}
