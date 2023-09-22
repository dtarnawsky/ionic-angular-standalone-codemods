import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import dedent from 'ts-dedent';

import { migrateComponents } from './0002-import-standalone-component';

describe('migrateComponents', () => {

  describe('standalone angular components', () => {

    it('should migrate components using inline templates', async () => {
      const project = new Project({ useInMemoryFileSystem: true });

      const component = `
        import { Component } from "@angular/core";

        @Component({
          selector: 'my-component',
          template: \`
            <ion-header>
              <ion-toolbar>
                <ion-title>My Component</ion-title>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-list>
                <ion-item>
                  <ion-label>My Item</ion-label>
                </ion-item>
              </ion-list>
            </ion-content>
          \`,
          standalone: true
        }) 
        export class MyComponent { }
      `;

      const componentSourceFile = project.createSourceFile('foo.component.ts', dedent(component));

      await migrateComponents(project, { dryRun: false });

      expect(dedent(componentSourceFile.getText())).toBe(dedent(`
        import { Component } from "@angular/core";
        import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from "@ionic/angular/standalone";

        @Component({
            selector: 'my-component',
            template: \`
            <ion-header>
              <ion-toolbar>
                <ion-title>My Component</ion-title>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-list>
                <ion-item>
                  <ion-label>My Item</ion-label>
                </ion-item>
              </ion-list>
            </ion-content>
          \`,
            standalone: true,
            imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel]
        })
        export class MyComponent { }
      `));
    });

    it('should migrate components using external templates', async () => {
      const project = new Project({ useInMemoryFileSystem: true });

      const component = `
      import { Component } from "@angular/core";

        @Component({
          selector: 'my-component',
          templateUrl: './my-component.component.html',
          standalone: true
        }) 
        export class MyComponent { }
      `;

      const template = `
      <ion-header>
        <ion-toolbar>
          <ion-title>My Component</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item>
            <ion-label>My Item</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
      `;

      const componentSourceFile = project.createSourceFile('foo.component.ts', dedent(component));
      project.createSourceFile('foo.component.html', dedent(template));

      await migrateComponents(project, { dryRun: false });

      expect(dedent(componentSourceFile.getText())).toBe(dedent(`
        import { Component } from "@angular/core";
        import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from "@ionic/angular/standalone";

        @Component({
            selector: 'my-component',
            templateUrl: './my-component.component.html',
            standalone: true,
            imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel]
        })
        export class MyComponent { }
      `));
    });

    it('should detect and import icons used in the template', async () => {
      const project = new Project({ useInMemoryFileSystem: true });

      const component = `
        import { Component } from "@angular/core";

        @Component({
          selector: 'my-component',
          template: '<ion-icon name="logo-ionic"></ion-icon>',
          standalone: true
        }) 
        export class MyComponent { }
      `;

      const componentSourceFile = project.createSourceFile('foo.component.ts', dedent(component));

      await migrateComponents(project, { dryRun: false });

      expect(dedent(componentSourceFile.getText())).toBe(dedent(`
        import { Component } from "@angular/core";
        import { addIcons } from "ionicons";
        import { logoIonic } from "ionicons/icons";
        import { IonIcon } from "@ionic/angular/standalone";

        @Component({
            selector: 'my-component',
            template: '<ion-icon name="logo-ionic"></ion-icon>',
            standalone: true,
            imports: [IonIcon]
        })
        export class MyComponent {
            constructor() {
                addIcons({ logoIonic });
            }
        }
      `));
    });

  });

  describe('single component angular modules', () => {

    it('should migrate angular module with Ionic components', async () => {
      const project = new Project({ useInMemoryFileSystem: true });

      const component = `
      import { Component } from "@angular/core";
      
      @Component({
        selector: 'my-component',
        template: \`
          <ion-header>
            <ion-toolbar>
              <ion-title>My Component</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list>
              <ion-item>
                <ion-label>My Item</ion-label>
              </ion-item>
            </ion-list>
          </ion-content>
        \`
      })
      export class MyComponent { }`;
      const module = `
      import { NgModule } from "@angular/core";
      import { IonicModule } from "@ionic/angular";

      import { MyComponent } from "./foo.component";
      
      @NgModule({
        imports: [IonicModule],
        declarations: [MyComponent],
        exports: [MyComponent]
      })
      export class MyComponentModule { }
      `;

      project.createSourceFile('foo.component.ts', dedent(component));
      const moduleSourceFile = project.createSourceFile('foo.module.ts', dedent(module));

      await migrateComponents(project, { dryRun: false });

      expect(dedent(moduleSourceFile.getText())).toBe(dedent(`
      import { NgModule } from "@angular/core";
      import { MyComponent } from "./foo.component";
      import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from "@ionic/angular/standalone";
      
      @NgModule({
          imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel],
          declarations: [MyComponent],
          exports: [MyComponent]
      })
      export class MyComponentModule { }
      `));

    });

  });

});