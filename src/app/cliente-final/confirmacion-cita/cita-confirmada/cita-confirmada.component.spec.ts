import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitaConfirmadaComponent } from './cita-confirmada.component';

describe('CitaConfirmadaComponent', () => {
  let component: CitaConfirmadaComponent;
  let fixture: ComponentFixture<CitaConfirmadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitaConfirmadaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitaConfirmadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
