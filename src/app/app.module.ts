import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { AppComponent } from './app.component';
// import eliminado: RegistraNegocioComponent

@NgModule({
	imports: [
		BrowserModule,
		RouterModule.forRoot(routes)
	],
	// No declarations, solo bootstrap para standalone
	// No bootstrap array for standalone components
})
export class AppModule {}
