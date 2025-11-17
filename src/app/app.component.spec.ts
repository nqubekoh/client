import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { FileService } from './file.service';

class MockFileService {
  list = jasmine.createSpy('list');
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let fileService: MockFileService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [FormsModule],
      providers: [{ provide: FileService, useClass: MockFileService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fileService = TestBed.inject(FileService) as unknown as MockFileService;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should call load on ngOnInit', async () => {
    const loadSpy = spyOn(component, 'load').and.returnValue(Promise.resolve());
    component.ngOnInit();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('load should request entries and set state (first page)', fakeAsync(() => {
    const mockResponse = {
      entries: [
        { name: 'file1', isDirectory: false, path: '/file1', size: 100, createdAt: new Date(), permissions: 'rw' },
      ],
      nextCursor: 'cursor-1',
    };

    fileService.list.and.returnValue(Promise.resolve(mockResponse));

    component.currentPath = '/';
    component.load(); // no cursor

    expect(component.loading).toBeTrue();
    tick();

    expect(fileService.list).toHaveBeenCalledWith('/', undefined, 300);
    expect(component.entries).toEqual(mockResponse.entries);
    expect(component.nextCursor).toBe('cursor-1');
    expect(component.loading).toBeFalse();
  }));

  it('load should append entries when cursor is provided (pagination)', fakeAsync(() => {
    component.entries = [
      { name: 'existing', isDirectory: false, path: '/existing', size: 10, createdAt: new Date(), permissions: 'rw' },
    ];

    const mockResponse = {
      entries: [
        { name: 'new-file', isDirectory: false, path: '/new-file', size: 20, createdAt: new Date(), permissions: 'rw' },
      ],
      nextCursor: 'cursor-2',
    };

    fileService.list.and.returnValue(Promise.resolve(mockResponse));

    component.currentPath = '/';
    component.load('cursor-1');
    tick();

    expect(fileService.list).toHaveBeenCalledWith('/', 'cursor-1', 300);
    expect(component.entries.length).toBe(2);
    expect(component.entries[1]).toEqual(mockResponse.entries[0]);
    expect(component.nextCursor).toBe('cursor-2');
    expect(component.loading).toBeFalse();
  }));

  it('load should handle errors and reset loading flag', fakeAsync(() => {
    const error = 'boom';
    fileService.list.and.returnValue(Promise.reject(error));

    const alertSpy = spyOn(window, 'alert');
    const consoleSpy = spyOn(console, 'error');

    component.currentPath = '/';
    component.load();
    tick();

    expect(consoleSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Failed to load directory: ' + error);
    expect(component.loading).toBeFalse();
  }));

  it('enter should do nothing for non-directory entries', fakeAsync(() => {
    const loadSpy = spyOn(component, 'load').and.returnValue(Promise.resolve());

    const entry = {
      isDirectory: false,
      path: '/file1',
      name: 'file1',
    };

    component.currentPath = '/';
    component.enter(entry);
    tick();

    expect(component.currentPath).toBe('/');
    expect(loadSpy).not.toHaveBeenCalled();
  }));

  it('enter should navigate into directory and load entries', fakeAsync(() => {
    const loadSpy = spyOn(component, 'load').and.returnValue(Promise.resolve());

    const entry = {
      isDirectory: true,
      path: '/subdir',
      name: 'subdir',
    };

    component.entries = [{ name: 'old', isDirectory: false }];
    component.nextCursor = 'something';

    component.enter(entry);
    tick();

    expect(component.currentPath).toBe('/subdir');
    expect(component.entries).toEqual([]);
    expect(component.nextCursor).toBeNull();
    expect(loadSpy).toHaveBeenCalled();
  }));

  it('loadMore should call load with nextCursor when present', fakeAsync(() => {
    const loadSpy = spyOn(component, 'load').and.returnValue(Promise.resolve());

    component.nextCursor = 'cursor-next';
    component.loadMore();
    tick();

    expect(loadSpy).toHaveBeenCalledWith('cursor-next');
  }));

  it('loadMore should not call load when nextCursor is null', fakeAsync(() => {
    const loadSpy = spyOn(component, 'load').and.returnValue(Promise.resolve());

    component.nextCursor = null;
    component.loadMore();
    tick();

    expect(loadSpy).not.toHaveBeenCalled();
  }));

  it('template should render rows for entries', () => {
    const now = new Date();
    component.entries = [
      {
        name: 'dir1',
        isDirectory: true,
        path: '/dir1',
        extension: null,
        size: 0,
        createdAt: now,
        permissions: 'rwx',
      },
      {
        name: 'file1.txt',
        isDirectory: false,
        path: '/file1.txt',
        extension: 'txt',
        size: 123,
        createdAt: now,
        permissions: 'rw-',
      },
    ];

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('dir1');
    expect(rows[1].textContent).toContain('file1.txt');
  });

  it('should show "Load more" button only when nextCursor is set', () => {
    const compiled: HTMLElement = fixture.nativeElement;

    // no nextCursor
    component.nextCursor = null;
    fixture.detectChanges();
    expect(compiled.querySelector('button.btn.btn-primary')).toBeNull();

    // with nextCursor
    component.nextCursor = 'cursor-x';
    fixture.detectChanges();
    expect(compiled.querySelector('button.btn.btn-primary')).not.toBeNull();
  });

});
