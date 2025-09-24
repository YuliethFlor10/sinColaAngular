import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendarCitaCliente } from './agendar-cita-cliente';

describe('AgendarCitaCliente', () => {
  let component: AgendarCitaCliente;
  let fixture: ComponentFixture<AgendarCitaCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendarCitaCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendarCitaCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
