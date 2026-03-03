import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TopNav } from '../top-nav/top-nav';
import { MainLayoutComponent } from '../main-layout/main-layout';
import { SessionSummary } from '../session-summary/session-summary';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    TopNav,
    SessionSummary,
    RouterModule
],
  templateUrl: './app-shell.html',
  styleUrls: ['./app-shell.css']
})
export class AppShell {}
