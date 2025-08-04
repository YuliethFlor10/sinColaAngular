import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaServicio } from './lista-servicio';

describe('ListaServicio', () => {
  let component: ListaServicio;
  let fixture: ComponentFixture<ListaServicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaServicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaServicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
