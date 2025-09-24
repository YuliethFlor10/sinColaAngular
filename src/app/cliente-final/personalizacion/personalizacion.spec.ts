import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Personalizacion } from './personalizacion';

describe('Personalizacion', () => {
  let component: Personalizacion;
  let fixture: ComponentFixture<Personalizacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Personalizacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Personalizacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
