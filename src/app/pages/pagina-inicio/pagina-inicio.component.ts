import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-inicio',
  templateUrl: './pagina-inicio.component.html',
  styleUrls: ['./pagina-inicio.component.css']
})
export class PaginaInicioComponent implements OnInit {

  constructor(private router: Router) { }

  irInicioSesion(): void {
    this.router.navigate(['/inicio-sesion']);
  }

  irRegistro(): void {
    this.router.navigate(['/inicio-sesion']);
  }

  ngOnInit(): void {
    this.addScrollEffect();
  }

  selectPlan(planType: string): void {
    console.log(`Plan seleccionado: ${planType}`);
    // Aquí puedes agregar la lógica para manejar la selección del plan
    // Por ejemplo, navegar a una página de registro con el plan seleccionado
    this.router.navigate(['/admin/citas'], { queryParams: { plan: planType } });
  }

  private addScrollEffect(): void {
    // Efecto de scroll para el header
    const header = document.querySelector('.lp-header');

    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }

    // Efecto de animación al hacer scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeInUp');
        }
      });
    }, observerOptions);

    // Observar elementos que deben animarse
    const elementsToAnimate = document.querySelectorAll('.feature-item, .mv-item, .plan-card, .team-member');
    elementsToAnimate.forEach(el => {
      observer.observe(el);
    });
  }
}
