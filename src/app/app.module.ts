import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { RegistraNegocioComponent } from './pages/registra-negocio.component';

@NgModule({
	imports: [
		BrowserModule,
		RouterModule.forRoot(routes)
	],
	// No declarations, solo bootstrap para standalone
	bootstrap: [AppComponent]
})
export class AppModule {}
