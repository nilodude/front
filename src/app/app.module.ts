import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TerminalModule } from 'primeng/terminal';
import { HttpClientModule } from '@angular/common/http';
import { MenubarModule } from 'primeng/menubar';
import { MessagesModule } from 'primeng/messages';
import { CarouselModule } from 'primeng/carousel';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    TerminalModule,
    HttpClientModule,
    MenubarModule,
    MessagesModule,
    CarouselModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
