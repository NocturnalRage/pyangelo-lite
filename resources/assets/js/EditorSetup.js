import { notify } from './pyangelo-notify'
import { saveAs } from 'file-saver'
import ace from 'ace'
import { staticWordCompleter } from './editorWordCompletion'

export class Editor {
  constructor (Sk, filename) {
    this.Sk = Sk
    this.isReadOnly = false

    this.currentSession = 0
    this.currentFilename = filename
    this.lastSaved = Date.now()
    this.saveEveryXMillis = 10000
    ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/')
    this.editor = ace.edit('editor')
    this.editor.$blockScrolling = Infinity
    this.editor.setTheme('ace/theme/dracula')
    this.editor.setOptions({
      readOnly: this.isReadOnly,
      fontSize: '12pt',
      enableBasicAutocompletion: true,
      enableSnippets: false,
      enableLiveAutocompletion: true
    })
    this.EditSession = ace.require('ace/edit_session').EditSession
    this.UndoManager = ace.require('ace/undomanager').UndoManager
    this.PythonMode = ace.require('ace/mode/python').Mode
    this.langTools = ace.require('ace/ext/language_tools')
    // which one is needed?
    this.langTools.setCompleters([staticWordCompleter])
    this.editor.completers = [staticWordCompleter]
    this.editSessions = []
  }

  clearAllAnnotations () {
    for (const session in this.editSessions) {
      this.editSessions[session].clearAnnotations()
    }
  }

  onChange (listenForErrors, autosave) {
    const closureEditor = this
    const listenForErrorsOn = listenForErrors
    const autosaveOn = autosave
    this.editor.on('change', function (delta) {
      if (listenForErrorsOn) {
        closureEditor.editSessions[closureEditor.currentSession].clearAnnotations()
        closureEditor.Sk.configure({
          __future__: closureEditor.Sk.python3
        })
        try {
          closureEditor.Sk.compile(
            closureEditor.getCode(closureEditor.currentSession),
            closureEditor.currentFilename,
            'exec',
            true
          )
        } catch (err) {
          if (err.traceback) {
            const lineno = err.traceback[0].lineno
            const colno = err.traceback[0].colno
            let errorMessage
            if (err.message) {
              errorMessage = err.message
            } else if (err.nativeError) {
              errorMessage = err.nativeError.message
            } else {
              errorMessage = err.toString()
            }
            closureEditor.editSessions[closureEditor.currentSession].setAnnotations([{
              row: lineno - 1,
              column: colno,
              text: errorMessage,
              type: 'error'
            }])
          }
        }
      }
      if (autosaveOn) {
        const currentTime = Date.now()
        if (currentTime - closureEditor.lastSaved > closureEditor.saveEveryXMillis) {
          closureEditor.saveToLocalStorage()
          closureEditor.lastSaved = currentTime
        }
      }
    })
  }

  listenForBreakPoints () {
    const closureEditor = this
    this.editor.on('guttermousedown', function (e) {
      const target = e.domEvent.target

      if (target.className.indexOf('ace_gutter-cell') === -1) {
        return
      }

      if (!closureEditor.editor.isFocused()) {
        return
      }

      if (e.clientX > 25 + target.getBoundingClientRect().left) {
        return
      }

      const row = e.getDocumentPosition().row
      const breakpoints = closureEditor.editSessions[closureEditor.currentSession].getBreakpoints(row, 0)

      // If there's a breakpoint already defined, it should be removed, offering the toggle feature
      if (typeof breakpoints[row] === typeof undefined) {
        closureEditor.editSessions[closureEditor.currentSession].setBreakpoint(row)
      } else {
        closureEditor.editSessions[closureEditor.currentSession].clearBreakpoint(row)
      }
    })
  }

  addSession (code) {
    let index = this.editSessions.push(new this.EditSession(code))
    index--
    this.editSessions[index].setMode(new this.PythonMode())
    this.editSessions[index].setUndoManager(new this.UndoManager())
    return index
  }

  replaceSession (index, code) {
    this.editSessions[index].setValue(code)
  }

  setSession (index) {
    this.editor.setSession(this.editSessions[index])
  }

  gotoLine (lineNo, colNo = 0, animate = true) {
    this.editor.gotoLine(lineNo, colNo, animate)
  }

  getCode (session) {
    return this.editSessions[session].getValue()
  }

  saveToLocalStorage () {
    const code = this.getCode(this.currentSession)

    try {
      localStorage.setItem(this.currentFilename, code)
    } catch (e) {
      notify('Unable to save to local storage')
    }
  }

  loadCodeFromLocalStorage () {
    try {
      const src = localStorage.getItem(this.currentFilename)
      if (!(src === null || src === '')) {
        this.replaceSession(this.currentSession, src)
      }
    } catch (e) {
      notify('Unable to load from local storage')
    }
  }

  loadFromProject () {
    fetch('/pyangelo/projects/' + this.currentFilename)
      .then(response => {
        if (response.ok) {
          return response.text()
        } else {
          return Promise.reject(Error('Project not found'))
        }
      })
      .then(code => {
        this.replaceSession(this.currentSession, code)
        this.saveToLocalStorage()
      })
      .catch(error => {
        notify('We could not load the project.', 'error')
        console.error(error)
      })
  }

  copyCode () {
    try {
      const code = this.getCode(this.currentSession)
      navigator.clipboard.writeText(code)

      copyToClipboard(code, 'Code copied to clipboard.', 'Unable to copy code to clipboard. Please copy the code manually.')
    } catch (e) {
      notify('Unable to copy code to clipboard. Please copy the code manually.')
    }
  }

  saveCodeToFile () {
    const filename = window.prompt('Enter file name:', this.currentFilename)
    if (filename == null) {
      return
    }
    const code = this.getCode(this.currentSession)
    const file = new File([code], filename, { type: 'text/plain;charset=utf-8' })
    saveAs(file)
    this.saveToLocalStorage()
  }

  setReadOnly (readOnly) {
    this.editor.setReadOnly(readOnly)
  }

  restoreReadOnly () {
    this.editor.setReadOnly(this.isReadOnly)
  }

  resize () {
    this.editor.resize()
  }
}

function copyToClipboard (text, successMsg, errorMsg) {
  const browser = detectBrowser()
  if (browser === 'Firefox') {
    navigator.clipboard.writeText(text)
    notify(successMsg)
  } else {
    navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
      if (result.state === 'granted' || result.state === 'prompt') {
        navigator.clipboard.writeText(text)
        notify(successMsg)
      } else {
        notify(errorMsg)
      }
    })
  }
}

function detectBrowser () {
  if ((navigator.userAgent.indexOf('Opera') || navigator.userAgent.indexOf('OPR')) !== -1) {
    return 'Opera'
  } else if (navigator.userAgent.indexOf('Chrome') !== -1) {
    return 'Chrome'
  } else if (navigator.userAgent.indexOf('Safari') !== -1) {
    return 'Safari'
  } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
    return 'Firefox'
  } else if ((navigator.userAgent.indexOf('MSIE') !== -1) || (!!document.documentMode === true)) {
    return 'IE'
  } else {
    return 'Unknown'
  }
}
