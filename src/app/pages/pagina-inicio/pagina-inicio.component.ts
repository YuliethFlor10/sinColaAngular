import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-inicio',
  templateUrl: './pagina-inicio.component.html',
  styleUrls: ['./pagina-inicio.component.css']
})
export class PaginaInicioComponent implements OnInit {
  mobileMenuOpen = false;

  constructor(private router: Router) { }

  irInicioSesion(): void {
    this.router.navigate(['/inicio-sesion']);
  }

  irRegistro(): void {
    this.router.navigate(['/inicio-sesion']);
  }

  ngOnInit(): void {
    this.addScrollEffect();
    this.addIntersectionObserver();
  }

  selectPlan(planType: string): void {
    console.log(`Plan seleccionado: ${planType}`);
    // Aquí puedes agregar la lógica para manejar la selección del plan
    // Por ejemplo, navegar a una página de registro con el plan seleccionado
    this.router.navigate(['/admin/citas'], { queryParams: { plan: planType } });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private addScrollEffect(): void {
    // Efecto de scroll para el header
    const header = document.querySelector('.modern-header');

    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }
  }

  private addIntersectionObserver(): void {
    // Configuración del observer para animaciones
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
    const elementsToAnimate = document.querySelectorAll(
      '.feature-card, .mission-card, .pricing-card, .team-card, .intro-content'
    );
    elementsToAnimate.forEach(el => {
      observer.observe(el);
    });
  }
}
