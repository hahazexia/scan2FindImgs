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
    const resourceRoot = vscode.Uri.joinPath(context.extensionUri, 'dist');
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

    const sizeFiles: any = await Promise.all(files.map(file => {
      return new Promise(async (resolve, reject) => {
        const i = path.join(firstWorkspaceFolderPath, file);
        const size = await getFilesize(i);

        resolve({
          relativeFile: file,
          absoluteFile: i,
          ...size,
        });
      });
    }));

    const imageGraph = sizeFiles.map((file: any) => {
      return {
        imageName: file.absoluteFile,
        originalImageName: file.relativeFile,
        dep: imgObj[file.absoluteFile],
        size: file.size,
        originalSize: file.originalSize,
      };
    });

    showResults(context, imageGraph, resourceRoot, rootPath[0].uri.fsPath);
  });

  context.subscriptions.push(disposable);
}

async function getFilesize(source: string) {
  try {
    const fsStat = fs.statSync(source);
    const { filesize } = await import('filesize');
    return {
      size: filesize(fsStat.size, { standard: 'jedec' }),
      originalSize: fsStat.size,
    };
  } catch (err) {
    console.error(`Failed to get filesize: ${source}`, err);
    vscode.window.showErrorMessage(language === 'zh' ? `获取图片大小失败: ${source}` : `Failed to get filesize: ${source}`);
    return {
      size: '',
      originalSize: '',
    };
  }
}

function showResults(context: any, images: any[], resourceRoot: any, firstWorkspaceFolderPath: any) {
  const panel = vscode.window.createWebviewPanel(
    'scan2findimgs',
    'scan2findimgs',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  const handledImages = images.map((i) => {
    const imagePath = path.join(firstWorkspaceFolderPath, i.originalImageName);
    const imageUri = vscode.Uri.file(imagePath);
    const webviewImageUri = panel.webview.asWebviewUri(imageUri).toString();
    return {
      ...i,
      webviewImageUri,
    }
  });
  console.log(handledImages, 'handledImages看看');
  const themeColors = vscode.workspace.getConfiguration('workbench.colorCustomizations');
  const backgroundColor = themeColors.get('editor.background');
  const textColor = themeColors.get('editor.foreground');

  const webviewResourceRoot = panel.webview.asWebviewUri(resourceRoot);
  let html = fs.readFileSync(path.resolve(__dirname, './index.html'), {
    encoding: 'utf-8',
  });
  html = html.replace(/\/VSCODE_WEBVIEW_BASE/g, webviewResourceRoot.toString());

  panel.webview.html = html;

  panel.webview.onDidReceiveMessage(
    message => {
      console.log(message, 'message');
      try {
        switch (message.command) {
          case 'openFile':
            openFile(JSON.parse(message.data));
            break;
          case 'init':
            panel.webview.postMessage({
              command: 'init',
              data: {
                backgroundColor,
                textColor,
                images: handledImages,
              }
            });
        }
      } catch(err) {
        console.log(err, 'onDidReceiveMessage err');
      }
      
    },
    undefined,
    context.subscriptions
  );
}

async function openFile(filePath: string) {
  try {
      const fileUri = vscode.Uri.file(filePath);
      await vscode.commands.executeCommand('vscode.open', fileUri);
  } catch (error: any) {
      vscode.window.showErrorMessage(`Error opening file: ${error.message}`);
  }
}

export function deactivate() { }