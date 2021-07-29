import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TerminalModule } from 'primeng/terminal';
import { HttpClientModule } from '@angular/common/http';
import { MenubarModule } from 'primeng/menubar';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TerminalModule,
    HttpClientModule,
    MenubarModule,
    MessagesModule,
    MessageModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
