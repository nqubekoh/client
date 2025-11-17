import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from './file.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AppComponent implements OnInit {
  currentPath = '/';
  entries: any[] = [];
  loading = false;
  nextCursor: string | null = null;

  constructor(private svc: FileService) {}

  ngOnInit() {
    this.load();
  }

  async load(cursor?: string) {
    this.loading = true;
    try {
      const res = await this.svc.list(this.currentPath, cursor, 300);
      if (!cursor) {
        this.entries = res.entries;
      } else {
        this.entries = this.entries.concat(res.entries);
      }
      this.nextCursor = res.nextCursor;
    } catch (e) {
      console.error(e);
      alert('Failed to load directory: ' + e);
    } finally {
      this.loading = false;
    }
  }

  async enter(entry: any) {
    if (!entry.isDirectory) return;
    this.currentPath = entry.path;
    this.nextCursor = null;
    this.entries = [];
    await this.load();
  }

  async loadMore() {
    if (this.nextCursor) {
      await this.load(this.nextCursor);
    }
  }
}
