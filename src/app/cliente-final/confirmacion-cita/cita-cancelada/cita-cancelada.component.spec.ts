import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitaCanceladaComponent } from './cita-cancelada.component';

describe('CitaCanceladaComponent', () => {
  let component: CitaCanceladaComponent;
  let fixture: ComponentFixture<CitaCanceladaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitaCanceladaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitaCanceladaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
