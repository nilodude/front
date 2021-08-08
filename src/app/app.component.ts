import { Component, ElementRef } from '@angular/core';
import { TerminalService } from 'primeng/terminal';
import { Subscription } from 'rxjs';
import { MatlabService } from './matlab.service';
import { Figure, MatlabResponse, MatlabSession } from './models';
import { MenubarModule } from 'primeng/menubar';
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
  figures: any[];
  prompt: string;

  constructor(
    private terminalService: TerminalService,
    private matlabService: MatlabService,
    private host: ElementRef
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
    this.menuItems = [
      {
        label: 'New',
        icon: 'pi pi-fw pi-plus',
        command: () => this.newWorkspace(),
      },
      {
        label: 'Join',
        icon: 'pi pi-fw pi-sign-in',
        items: this.menuItemSessions,
      },

      {
        label: 'Stop/Restart',
        icon: 'pi pi-fw pi-replay',
        items: [
          {
            label: 'Delete',
            icon: 'pi pi-fw pi-trash',
            command: () => this.stopSession(this.session),
          },
          {
            label: 'Restart',
            icon: 'pi pi-fw pi-refresh',
            command: () => this.restartSession(this.session),
          },
        ],
      },
    ];
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
    this.msgs.push({
      severity: 'warn',
      summary: '',
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
          summary: '',
          detail: result.result,
        });
        this.displayTerminal = true;
        this.getSessions();
      },
      (error) => {
        console.log(error);
        this.msgs.push({ severity: 'error', summary: '', detail: error });
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
            summary: '',
            detail: 'No Matlab workspaces running!',
          });
        } else {
          // this.msgs = [];
          runningSessions.forEach((session) => {
            this.msgs.push({
              severity: 'info',
              summary: '',
              detail: 'Workspace ' + session.sid + ', PID = ' + session.pid,
            });
            this.menuItemSessions.push({
              label: 'Workspace ' + session.sid + ', PID = ' + session.pid,
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
    this.displayFigures= false;
    this.session = session;
    this.msgs = [];
    this.msgs.push({
      severity: 'success',
      summary: '',
      detail: 'Joined Workspace ' + session.sid,
    });
    this.displayTerminal = true;
    this.matlabService.getFigures(session.sid).subscribe(
      (result) => {
        this.matlabResponse = result as MatlabResponse;
        this.plotFigures();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  stopSession(session: MatlabSession) {
    this.displayTerminal = false;
    this.displayFigures = false;
    this.msgs = [];
    this.msgs.push({
      severity: 'success',
      summary: '',
      detail: 'Stopping Workspace...' + session.sid,
    });
    this.matlabService.stopSession(session.sid, false).subscribe(
      (result) => {
        this.msgs = [];
        this.msgs.push({
          severity: 'success',
          summary: '',
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

  restartSession(session: MatlabSession) {
    this.displayTerminal = false;
    this.msgs = [];
    this.msgs.push({
      severity: 'success',
      summary: '',
      detail: 'Restarting Workspace...' + session.sid,
    });

    this.matlabService.stopSession(session.sid, true).subscribe(
      (result) => {
        this.session = result.session as MatlabSession;
        this.msgs = [];
        this.msgs.push({
          severity: 'success',
          summary: '',
          detail: result.result,
        });

        this.getSessions();
        this.displayTerminal = true;
      },
      (error) => {
        console.log(error);
        this.msgs.push({ severity: 'error', summary: '', detail: error.error });
      }
    );
  }

  plotFigures(): void {
    this.figures=[];
    if (this.matlabResponse.figures.length > 0) {
      this.displayFigures = true;
      this.matlabResponse.figures.forEach((figure) => {
        const fig = figure as Figure;
        this.figures.push({
          id: fig.id,
          src: 'data:image/png;base64,' + fig.base64,
        });
      });
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

  clearConsole(): void{
    document.getElementsByClassName('p-terminal-content')[0].innerHTML = "";
  }
}
