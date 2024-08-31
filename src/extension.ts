import * as vscode from 'vscode';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import DependencyGraph from './dependency-graph';

let language: string = 'en';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('scan2findimgs');
  language = config.get('language') || 'en';

  let disposable = vscode.commands.registerCommand('extension.scan2findimgs', async () => {
    const config = vscode.workspace.getConfiguration('scan2findimgs');
    const ignoreArr: string[] = config.get('ignore') || ['node_modules/**'];
    const formatStr = config.get('format') || 'png,jpg,jpeg,gif,bmp,svg';
    const rootPath = vscode.workspace.workspaceFolders;
    if (!rootPath) {
      vscode.window.showErrorMessage(language = 'zh' ? '没有打开文件夹' : 'No folder opened.');
      return;
    }

    const firstWorkspaceFolderPath = rootPath[0].uri.toString().replace(/^file:\/\//, '');

    const graph = new DependencyGraph(firstWorkspaceFolderPath, ignoreArr);
    await graph.build();
    const imgObj = graph.getImageMap();
    const files = glob.sync(`**/*.{${formatStr}}`, {
      cwd: firstWorkspaceFolderPath,
      ignore: ignoreArr,
    });
    console.log('firstWorkspaceFolderPath', firstWorkspaceFolderPath);
    const imageGraph = files.map(file => {
      const i = path.join(firstWorkspaceFolderPath, file);

      return {
        imageName: i,
        dep: imgObj[i],
      };
    });

    // console.log('imgObj', imgObj);
    console.log(imageGraph, 'imageGraph看看');

    // showResults(images, references);
  });

  context.subscriptions.push(disposable);
}

function showResults(images: string[], references: { [key: string]: string[] }) {
  const panel = vscode.window.createWebviewPanel(
    'imageReferences',
    'Image References',
    vscode.ViewColumn.One,
    {}
  );``

  panel.webview.html = getWebviewContent(images, references);
}

function getWebviewContent(images: string[], references: { [key: string]: string[] }): string {
  // TODO: Generate HTML content for the webview
  return '';
}

export function deactivate() { }