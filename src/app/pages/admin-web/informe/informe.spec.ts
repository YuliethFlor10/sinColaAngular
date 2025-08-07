import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Informe } from './informe';

describe('Informe', () => {
  let component: Informe;
  let fixture: ComponentFixture<Informe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Informe]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Informe);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
