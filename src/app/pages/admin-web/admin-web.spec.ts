import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWeb } from './admin-web';

describe('AdminWeb', () => {
  let component: AdminWeb;
  let fixture: ComponentFixture<AdminWeb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWeb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWeb);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
