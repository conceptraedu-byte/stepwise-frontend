import { Component } from '@angular/core';

import { AnalyticsPanel } from '../analytics-panel/analytics-panel';
import { TutorWorkspaceComponent } from '../tutor-workspace/tutor-workspace';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    AnalyticsPanel,
    TutorWorkspaceComponent
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent {

  hasEngaged = false;

  onChatEngaged() {
    this.hasEngaged = true;
  }
}
