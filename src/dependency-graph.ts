import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as ofs from "fs";

class DependencyGraph {
  private graph: Map<string, Set<string>> = new Map();

  constructor(
    private rootPath: string,
    private ignoreArr: string[],
  ) {}

  private findNearestNodeModules(filePath: string, rootDir: string): string {
    while (true) {
      const nodeModulesPath = path.join(filePath, 'node_modules');
      if (ofs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
      }
      if (filePath === rootDir) {
        return '';
      }
      filePath = path.dirname(filePath);
    }
  }

  private findTsconfig(rootDir: string): string {
    try {
      const tsconfig = glob.sync('**/tsconfig.json', {
        cwd: rootDir,
        ignore: this.ignoreArr,
      });
      if (tsconfig?.length === 0) {
        return '';
      }
      return path.join(rootDir, tsconfig[0]);
    } catch (err) {
      console.log(`findTsconfig err: ${err}`);
      return '';
    }
  }

  private isLocalFile(filePath: string): boolean {
    try {
      return !(filePath.startsWith('http') || filePath.startsWith('data:image'));
    } catch (err) {
      return false;
    }
  }

  async build() {
    try {
      console.log(this.rootPath, 'rootPath');
      const { jsonrepair } = await import('jsonrepair');
      const tsconfigPath = this.findTsconfig(this.rootPath);
      let tsBaseUrl = '';
      let alias: any = null;
      if (tsconfigPath) {
        const tsconfigStr: any = fs.readFileSync(tsconfigPath, {
          encoding: 'utf-8',
        });
        const tsconfigObj = JSON.parse(jsonrepair(tsconfigStr));
        tsBaseUrl = tsconfigObj?.compilerOptions?.baseUrl || '';
        const paths = tsconfigObj?.compilerOptions?.paths || [];
        console.log('tsconfigObj', tsconfigObj, typeof tsconfigObj);
        alias = paths ?Object.keys(paths).reduce((acc: any, i: any) => {
          const key = i.slice(-1) === '*' ? i.slice(0, -1) : i;
          const value = paths[i][0].slice(-1) === '*' ? paths[i][0].slice(0, -1) : paths[i];
          acc[key] = value;
          return acc;
        }, {})
        : null;
        const excludeFolder = tsconfigObj?.exclude?.map((i: any) => `${i}${i.slice(-1) === '/' ? '' : '/'}**`);
        this.ignoreArr = [
          ...this.ignoreArr,
          ...tsconfigObj?.exclude,
          ...excludeFolder,
        ];
      }
      console.log('tsBaseUrl', tsBaseUrl, 'alias', alias);
      const files = glob.sync('**/*.{js,ts,jsx,tsx,css,scss,sass,less,styl}', {
        cwd: this.rootPath,
        ignore: this.ignoreArr,
      });

      for (const file of files) {
        const filePath = path.join(this.rootPath, file);
        const nodeModulesPath = this.findNearestNodeModules(filePath, this.rootPath);
        const content = await fs.readFile(filePath, 'utf-8');
        const dependencies = this.extractDependencies(content);
  
        dependencies.forEach((dependency) => {
          let handledDependency = dependency.path;
          if (dependency.type === 'html,css') {
            handledDependency = path.join(path.dirname(filePath), dependency.path);
          } else if (alias && Object.keys(alias).some((i: any) => dependency.path.startsWith(i))) {
            const aliasKey = Object.keys(alias).find((i: any) => dependency.path.startsWith(i));
            let aliasPath = '';
            if (aliasKey !== undefined) {
              aliasPath = alias[aliasKey];
            }
            handledDependency = path.join(this.rootPath, tsBaseUrl, aliasPath, dependency.path.replace(aliasKey || '', ''));
          } else if (!(dependency.path.startsWith('.') || dependency.path.startsWith('..'))) {
            handledDependency = `${nodeModulesPath ? nodeModulesPath : '/node_modules'}/${dependency.path}`;
          } else {
            handledDependency = path.join(path.dirname(filePath), dependency.path);
          }
          this.addEdge(filePath, handledDependency);
        });
      }
      // this.graph.forEach((value: any, key: string) => {
      //   console.log(`key: ${key}, value: ${JSON.stringify(Array.from(value))}`)
      // });
    } catch (err: any) {
      console.log('dependency graph build error', err);
    }
  }

  private extractDependencies(content: string): { path: string; type: string; }[] {
    try {
      const dependencyPattern = /(?:import|require)\s+(?:.*from\s+)?(['](.+?)[']|["](.+?)["])/g;
      const htmlcssPattern = /(?:src=(?:(?:['](.+?)['])|(?:["](.+?)["])))|(?:url\(['"]?(.+?)['"]?\))/g;
      const dependencies: { path: string; type: string; }[] = [];
      let matchDep: RegExpExecArray | null;
      let matchHtml: RegExpExecArray | null;

      while ((matchDep = dependencyPattern.exec(content)) !== null) {
        dependencies.push({
          path: matchDep[2] || matchDep[3],
          type: 'import,require',
        });
      }
      while (
        (matchHtml = htmlcssPattern.exec(content)) !== null
          && (
            this.isLocalFile(matchHtml[1])
            || this.isLocalFile(matchHtml[2])
            || this.isLocalFile(matchHtml[3])
          )
    ) {
        dependencies.push({
          path: matchHtml[1] || matchHtml[2] || matchHtml[3],
          type: 'html,css',
        });
      }
      return dependencies;
    } catch (err: any) {
      
      console.log('dependency graph extractDependencies error', err);
      return [];
    }
  }

  private addEdge(from: string, to: string) {
    if (!this.graph.has(from)) {
      this.graph.set(from, new Set());
    }
    this.graph.get(from)!.add(to);
  }

  getDependencies(file: string): Set<string> | undefined {
    return this.graph.get(file);
  }
  getImageMap() {
    const obj: any = {};
    this.graph.forEach((value: any, key: string) => {
      const arr = Array.from(value);
      arr.forEach((i: any) => {
        if (/^(.*[\/\\])?(.*\.(png|jpg|jpeg|gif|bmp|svg))$/i.test(i)) {
          obj[i]
            ? obj[i].push(key)
            : obj[i] = [key];
        }
      });
    });
    return obj;
  }
}

export default DependencyGraph;