import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent, Tab } from './tabs.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  const mockTabs: Tab[] = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2', icon: '📊' },
    { id: 'tab3', label: 'Tab 3' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Tab rendering', () => {
    it('should render all tabs', () => {
      component.tabs = mockTabs;
      fixture.detectChanges();

      const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
      expect(tabButtons.length).toBe(3);
    });

    it('should display tab labels correctly', () => {
      component.tabs = mockTabs;
      fixture.detectChanges();

      const tabLabels = fixture.debugElement.queryAll(By.css('.tab-label'));
      expect(tabLabels[0].nativeElement.textContent).toBe('Tab 1');
      expect(tabLabels[1].nativeElement.textContent).toBe('Tab 2');
      expect(tabLabels[2].nativeElement.textContent).toBe('Tab 3');
    });

    it('should render icon when provided', () => {
      component.tabs = mockTabs;
      fixture.detectChanges();

      const tabIcons = fixture.debugElement.queryAll(By.css('.tab-icon'));
      expect(tabIcons.length).toBe(1);
      expect(tabIcons[0].nativeElement.textContent).toBe('📊');
    });

    it('should not render icon when not provided', () => {
      component.tabs = [{ id: 'tab1', label: 'Tab 1' }];
      fixture.detectChanges();

      const tabIcons = fixture.debugElement.queryAll(By.css('.tab-icon'));
      expect(tabIcons.length).toBe(0);
    });
  });

  describe('Active tab', () => {
    it('should apply active class to active tab', () => {
      component.tabs = mockTabs;
      component.activeTabId = 'tab2';
      fixture.detectChanges();

      const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
      expect(tabButtons[1].nativeElement.classList.contains('active')).toBe(true);
      expect(tabButtons[0].nativeElement.classList.contains('active')).toBe(false);
      expect(tabButtons[2].nativeElement.classList.contains('active')).toBe(false);
    });

    it('should update active tab when activeTabId changes', () => {
      component.tabs = mockTabs;
      component.activeTabId = 'tab1';
      fixture.detectChanges();

      let tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
      expect(tabButtons[0].nativeElement.classList.contains('active')).toBe(true);

      component.activeTabId = 'tab3';
      fixture.detectChanges();

      tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
      expect(tabButtons[2].nativeElement.classList.contains('active')).toBe(true);
      expect(tabButtons[0].nativeElement.classList.contains('active')).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for active tab', () => {
      component.activeTabId = 'tab1';
      expect(component.isActive('tab1')).toBe(true);
    });

    it('should return false for inactive tab', () => {
      component.activeTabId = 'tab1';
      expect(component.isActive('tab2')).toBe(false);
    });
  });

  describe('onTabClick', () => {
    it('should emit tabChange event when clicking a different tab', () => {
      spyOn(component.tabChange, 'emit');
      component.activeTabId = 'tab1';

      component.onTabClick('tab2');

      expect(component.activeTabId).toBe('tab2');
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
    });

    it('should not emit tabChange event when clicking the same tab', () => {
      spyOn(component.tabChange, 'emit');
      component.activeTabId = 'tab1';

      component.onTabClick('tab1');

      expect(component.tabChange.emit).not.toHaveBeenCalled();
    });

    it('should update activeTabId', () => {
      component.activeTabId = 'tab1';
      component.onTabClick('tab3');

      expect(component.activeTabId).toBe('tab3');
    });
  });

  describe('Click events', () => {
    it('should trigger onTabClick when tab button is clicked', () => {
      component.tabs = mockTabs;
      component.activeTabId = 'tab1';
      fixture.detectChanges();

      spyOn(component, 'onTabClick');

      const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
      tabButtons[1].nativeElement.click();

      expect(component.onTabClick).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty tabs array', () => {
      component.tabs = [];
      fixture.detectChanges();

      const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));
      expect(tabButtons.length).toBe(0);
    });

    it('should handle tabs with special characters in labels', () => {
      component.tabs = [
        { id: 'special', label: 'Tab & Special <> Characters' }
      ];
      fixture.detectChanges();

      const tabLabel = fixture.debugElement.query(By.css('.tab-label'));
      expect(tabLabel.nativeElement.textContent).toBe('Tab & Special <> Characters');
    });
  });
});


