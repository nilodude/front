import { Component } from '@angular/core';
import { TerminalService } from 'primeng/terminal';
import { Subscription } from 'rxjs';
import { MatlabService } from './matlab.service';
import { MatlabResponse, MatlabSession } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [TerminalService],
})
export class AppComponent {
  title = 'front';
  subscription: Subscription = new Subscription();
  session: MatlabSession = new MatlabSession();
  matlabResponse: MatlabResponse;
  figures: string[];

  constructor(
    private terminalService: TerminalService,
    private matlabService: MatlabService
  ) {
    this.terminalService.commandHandler.subscribe((command) => {
      this.matlabService.runCommand(1, command).subscribe(
        (result) => {
          this.matlabResponse = result as MatlabResponse;
          this.terminalService.sendResponse(this.matlabResponse.result);
        },
        (error) => {
          console.log(error);
        }
      );
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
