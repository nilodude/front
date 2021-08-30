import { Component } from '@angular/core';
import { TerminalService } from 'primeng/terminal';
import { Subscription } from 'rxjs';
import { MatlabService } from './matlab.service';
import { Figure, MatlabResponse, MatlabSession } from './models';
import { MenuItem, Message } from 'primeng/api';

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
  sessions: MatlabSession[];
  matlabResponse: MatlabResponse;
  menuItems: MenuItem[];
  element: HTMLElement;
  msgs: Message[];
  menuItemSessions: MenuItem[];
  displayTerminal: boolean;
  displayFigures: boolean;
  figures: Figure[];
  prompt: string;

  constructor(
    private terminalService: TerminalService,
    private matlabService: MatlabService,
  ) {
    this.terminalService.commandHandler.subscribe((command) => {
      this.prompt = "<<";
      this.matlabService.runCommand(this.session.sid, command).subscribe(
        (result) => {
          this.matlabResponse = new MatlabResponse();
          this.matlabResponse = result as MatlabResponse;
          this.terminalService.sendResponse(this.matlabResponse.result);
          if(command === 'clc'){
            this.clearConsole();
          } 
          this.plotFigures();
          this.prompt = ">>";
        },
        (error) => {
          console.log(error);
          this.msgs = [];
          this.msgs.push({
            severity: 'error',
            detail: error,
          });
        }
      );
    });
  }

  ngOnInit() {
    this.displayTerminal = false;
    this.msgs = [];
    this.element = document.getElementById('termi') as HTMLElement;
    this.getSessions();
    this.figures = [];
    this.prompt = ">>";
  }

  getMenuItems(): MenuItem[] {
    this.menuItems = [];
    
    this.menuItems.push( {
      label: 'New',
      icon: 'pi pi-fw pi-plus',
      command: () => this.newWorkspace(),
    });
    if(this.menuItemSessions.length > 0){
      this.menuItems.push({
        label: 'Join',
        icon: 'pi pi-fw pi-sign-in',
        items: this.menuItemSessions,
      });
    }
    if(this.session.pid){
      this.menuItems.push({
        label: 'Stop/Restart',
        icon: 'pi pi-fw pi-replay',
        items: [
          {
            label: 'Close',
            icon: 'pi pi-fw pi-trash',
            command: () => this.closeWorkspace(this.session),
          },
          {
            label: 'Restart',
            icon: 'pi pi-fw pi-refresh',
            command: () => this.restartWorkspace(this.session),
          },
        ]
      });
    } 
    return this.menuItems;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  newWorkspace(): void {
    this.displayFigures= false;
    this.displayTerminal = false;
    this.msgs = [];
    this.msgs.push({
      severity: 'warn',
      detail: 'Starting New Workspace...',
    });
    this.matlabService.newWorkspace().subscribe(
      (result) => {
        this.session = new MatlabSession();
        this.session = result.session as MatlabSession;
        sessionStorage.setItem('currentSession', JSON.stringify(this.session));
        this.msgs = [];
        this.msgs.push({
          severity: 'success',
          detail: result.result,
        });
        this.displayTerminal = true;
        this.getSessions();
      },
      (error) => {
        console.log(error);
        this.msgs.push({ severity: 'error', detail: error });
      }
    );
  }

  getSessions() {
    this.menuItemSessions = [];
    this.matlabService.getSessions().subscribe(
      (result) => {
        this.sessions = result.sessions as MatlabSession[];
        const runningSessions = this.sessions.filter((each) => each.pid);
        if (runningSessions.length === 0) {
          this.msgs = [];
          this.msgs.push({
            severity: 'info',
            detail: 'No Matlab workspaces running!',
          });
        } else {
          runningSessions.forEach((session) => {
            this.menuItemSessions.push({
              label: 'Workspace ' + session.sid + ' (PID=' + session.pid+')',
              command: () => this.joinWorkspace(session),
            });
          });
        }
        this.getMenuItems();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  joinWorkspace(session: MatlabSession) {
    this.displayTerminal = false;
    this.displayFigures= false;
    this.session = session;
    this.msgs = [];
    this.msgs.push({
      severity: 'success',
      detail: 'Joined Workspace ' + session.sid,
    });
    
    this.clearConsole();
    this.matlabService.getFigures(session.sid).subscribe(
      (result) => {
        this.matlabResponse = result as MatlabResponse;
        this.getMenuItems();
        this.displayTerminal = true;
        this.plotFigures();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  closeWorkspace(session: MatlabSession) {
    this.displayTerminal = false;
    this.displayFigures = false;
    this.msgs = [];
    this.msgs.push({
      severity: 'success',
      detail: 'Closing Workspace...' + session.sid,
    });
    this.matlabService.stopMatlab(session.sid, false).subscribe(
      (result) => {
        this.msgs = [];
        this.msgs.push({
          severity: 'success',
          detail: result.result,
        });
        this.session = new MatlabSession();
        this.getSessions();
      },
      (error) => {
        console.log(error);
        this.msgs.push({ severity: 'error', summary: '', detail: error });
      }
    );
  }

  restartWorkspace(session: MatlabSession) {
    this.displayTerminal = false;
    this.msgs = [];
    this.msgs.push({
      severity: 'success',
      detail: 'Restarting Workspace...' + session.sid,
    });

    this.matlabService.stopMatlab(session.sid, true).subscribe(
      (result) => {
        this.session = result.session as MatlabSession;
        this.msgs = [];
        this.msgs.push({
          severity: 'success',
          detail: result.result,
        });

        this.getSessions();
        this.displayTerminal = true;
      },
      (error) => {
        console.log(error);
        this.msgs.push({ severity: 'error', detail: error.error });
      }
    );
  }

  plotFigures(): void {
    this.figures=[];
    this.displayFigures = false;
    if (this.matlabResponse.figures.length > 0) {
      this.displayFigures = true;
    }
  }

  closeFigure(id: number): void {
    this.figures = this.figures.filter((figure) => figure.id !== id);
    this.matlabResponse.figures = this.matlabResponse.figures.filter((figure) => figure.id !== id);
    this.prompt = "<<";
    this.matlabService.runCommand(this.session.sid, 'close '+id).subscribe(
      (result) => {
        this.plotFigures();
        this.prompt = ">>";
      },
      (error) => {
        console.log(error);
      }
    );
  }
  // hay que borrar solo los span p-terminal-command
  clearConsole(): void{
    if(document.getElementsByClassName('p-terminal-content')[0]){
    document.getElementsByClassName('p-terminal-content')[0].innerHTML = "";
    }
  }
}
