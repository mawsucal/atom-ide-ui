'use strict';

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _atom = require('atom');

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('nuclide-commons/nuclideUri'));
}

var _testHelpers;

function _load_testHelpers() {
  return _testHelpers = require('nuclide-commons-atom/test-helpers');
}

var _Hyperclick;

function _load_Hyperclick() {
  return _Hyperclick = _interopRequireDefault(require('../lib/Hyperclick'));
}

var _showTriggerConflictWarning;

function _load_showTriggerConflictWarning() {
  return _showTriggerConflictWarning = _interopRequireDefault(require('../lib/showTriggerConflictWarning'));
}

var _package;

function _load_package() {
  return _package = require('../package.json');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */

beforeEach(() => {
  Object.keys((_package || _load_package()).atomConfig).forEach(key => {
    const config = (_package || _load_package()).atomConfig[key];
    atom.config.setSchema(`hyperclick.${key}`, Object.assign({}, config, {
      // To make testing easier, use metaKey on all platforms.
      default: 'metaKey'
    }));
  });
});

describe('Hyperclick', () => {
  let setup = (() => {
    var _ref = (0, _asyncToGenerator.default)(function* () {
      (0, (_testHelpers || _load_testHelpers()).jasmineAttachWorkspace)();

      atom.packages.activatePackage('hyperclick');

      textEditor = yield atom.workspace.open((_nuclideUri || _load_nuclideUri()).default.join(__dirname, 'fixtures', 'hyperclick.txt'));
      textEditorView = atom.views.getView(textEditor);

      hyperclick = new (_Hyperclick || _load_Hyperclick()).default();
      hyperclickForTextEditor = Array.from(hyperclick._hyperclickForTextEditors)[0];
    });

    return function setup() {
      return _ref.apply(this, arguments);
    };
  })();

  /**
   * Returns the pixel position in the DOM of the text editor's screen position.
   * This is used for dispatching mouse events in the text editor.
   *
   * Adapted from https://github.com/atom/atom/blob/5272584d2910e5b3f2b0f309aab4775eb0f779a6/spec/text-editor-component-spec.coffee#L2845
   */


  let textEditor = null;
  let textEditorView = null;
  let hyperclick = null;
  let hyperclickForTextEditor = null;

  function clientCoordinatesForScreenPosition(screenPosition) {
    const positionOffset = textEditorView.pixelPositionForScreenPosition(screenPosition);
    const scrollViewElement = textEditorView.querySelector('.scroll-view');

    if (!(scrollViewElement != null)) {
      throw new Error('Invariant violation: "scrollViewElement != null"');
    }

    const scrollViewClientRect = scrollViewElement.getBoundingClientRect();
    const clientX = scrollViewClientRect.left + positionOffset.left - textEditorView.getScrollLeft();
    const clientY = scrollViewClientRect.top + positionOffset.top - textEditorView.getScrollTop();
    return { clientX, clientY };
  }

  function dispatch(eventClass, type, position, properties) {
    const { clientX, clientY } = clientCoordinatesForScreenPosition(position);
    const mouseEventInit = {
      clientX,
      clientY,
      metaKey: properties != null ? properties.metaKey : undefined
    };
    const event = new eventClass(type, mouseEventInit);
    let domNode = null;
    if (eventClass === MouseEvent) {
      const { component } = textEditorView;

      if (!component) {
        throw new Error('Invariant violation: "component"');
      }

      if (component.refs != null) {
        domNode = component.refs.lineTiles;
      } else {
        domNode = component.linesComponent.getDomNode();
      }
    } else {
      domNode = textEditorView;
    }
    domNode.dispatchEvent(event);
  }

  describe('without line wrapping', () => {
    beforeEach(() => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        yield setup();
      }));
    });

    afterEach(() => {
      hyperclick.dispose();
    });

    describe('simple case', () => {
      let provider = null;
      const position = new _atom.Point(0, 1);

      let disposable;
      beforeEach(() => {
        provider = {
          providerName: 'test',
          getSuggestionForWord(sourceTextEditor, text, range) {
            return (0, _asyncToGenerator.default)(function* () {
              return { range, callback: function () {} };
            })();
          },
          priority: 0
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        disposable = hyperclick.addProvider(provider);
      });
      it('should call the provider', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          yield hyperclick.getSuggestion(textEditor, position);
          expect(provider.getSuggestionForWord).toHaveBeenCalled();
        }));
      });
      it('should not call a removed provider', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          disposable.dispose();
          yield hyperclick.getSuggestion(textEditor, position);
          expect(provider.getSuggestionForWord).not.toHaveBeenCalled();
        }));
      });
    });

    describe('<meta-mousemove> + <meta-mousedown>', () => {
      it('consumes single-word providers without wordRegExp', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);
          const expectedText = 'word1';
          const expectedRange = _atom.Range.fromObject([[0, 0], [0, 5]]);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback.callCount).toBe(1);
        }));
      });

      it('consumes single-word providers with wordRegExp', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            wordRegExp: /word/g,
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 8);
          const expectedText = 'word';
          const expectedRange = _atom.Range.fromObject([[0, 6], [0, 10]]);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback.callCount).toBe(1);
        }));
      });

      it('consumes multi-range providers', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestion(sourceTextEditor, sourcePosition) {
              return (0, _asyncToGenerator.default)(function* () {
                const range = [new _atom.Range(sourcePosition, sourcePosition.translate([0, 1])), new _atom.Range(sourcePosition.translate([0, 2]), sourcePosition.translate([0, 3]))];
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestion').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 8);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestion).toHaveBeenCalledWith(textEditor, position);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback.callCount).toBe(1);
        }));
      });

      it('consumes multiple providers from different sources', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback1 = jasmine.createSpy('callback');
          const provider1 = {
            providerName: 'test',
            // Do not return a suggestion, so we can fall through to provider2.
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {})();
            },
            priority: 0
          };
          spyOn(provider1, 'getSuggestionForWord').andCallThrough();

          const callback2 = jasmine.createSpy('callback');
          const provider2 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback2 };
              })();
            },
            priority: 0
          };
          spyOn(provider2, 'getSuggestionForWord').andCallThrough();

          hyperclick.addProvider(provider1);
          hyperclick.addProvider(provider2);

          const position = new _atom.Point(0, 1);
          const expectedText = 'word1';
          const expectedRange = _atom.Range.fromObject([[0, 0], [0, 5]]);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider2.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback1.callCount).toBe(0);
          expect(callback2.callCount).toBe(1);
        }));
      });

      it('consumes multiple providers from the same source', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback1 = jasmine.createSpy('callback');
          const provider1 = {
            providerName: 'test',
            // Do not return a suggestion, so we can fall through to provider2.
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {})();
            },
            priority: 0
          };
          spyOn(provider1, 'getSuggestionForWord').andCallThrough();

          const callback2 = jasmine.createSpy('callback');
          const provider2 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback2 };
              })();
            },
            priority: 0
          };
          spyOn(provider2, 'getSuggestionForWord').andCallThrough();

          hyperclick.addProvider([provider1, provider2]);

          const position = new _atom.Point(0, 1);
          const expectedText = 'word1';
          const expectedRange = _atom.Range.fromObject([[0, 0], [0, 5]]);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider2.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback1.callCount).toBe(0);
          expect(callback2.callCount).toBe(1);
        }));
      });
    });

    describe('avoids excessive calls', () => {
      it('ignores <mousemove> in the same word as the last position', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                // Never resolve this, so we know that no suggestion is set.
                return new Promise(function () {});
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          dispatch(MouseEvent, 'mousemove', position.translate([0, 1]), {
            metaKey: true
          });
          dispatch(MouseEvent, 'mousemove', position.translate([0, 2]), {
            metaKey: true
          });

          expect(provider.getSuggestionForWord.callCount).toBe(1);
        }));
      });

      it('ignores <mousemove> in the same single-range as the last suggestion', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);
          const expectedText = 'word1';
          const expectedRange = _atom.Range.fromObject([[0, 0], [0, 5]]);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

          dispatch(MouseEvent, 'mousemove', position.translate([0, 1]), {
            metaKey: true
          });
          expect(provider.getSuggestionForWord.callCount).toBe(1);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback.callCount).toBe(1);
        }));
      });

      it('handles <mousemove> in a different single-range as the last suggestion', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const position1 = new _atom.Point(0, 1);
          const expectedText1 = 'word1';
          const expectedRange1 = _atom.Range.fromObject([[0, 0], [0, 5]]);

          dispatch(MouseEvent, 'mousemove', position1, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText1, expectedRange1);

          const position2 = new _atom.Point(0, 8);
          const expectedText2 = 'word2';
          const expectedRange2 = _atom.Range.fromObject([[0, 6], [0, 11]]);
          dispatch(MouseEvent, 'mousemove', position2, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText2, expectedRange2);

          expect(provider.getSuggestionForWord.callCount).toBe(2);

          dispatch(MouseEvent, 'mousedown', position2, { metaKey: true });
          expect(callback.callCount).toBe(1);
        }));
      });

      it('ignores <mousemove> in the same multi-range as the last suggestion', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const range = [new _atom.Range(new _atom.Point(0, 1), new _atom.Point(0, 2)), new _atom.Range(new _atom.Point(0, 4), new _atom.Point(0, 5))];
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestion(sourceTextEditor, sourcePosition) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestion').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestion).toHaveBeenCalledWith(textEditor, position);

          dispatch(MouseEvent, 'mousemove', new _atom.Point(0, 4), { metaKey: true });
          expect(provider.getSuggestion.callCount).toBe(1);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(callback.callCount).toBe(1);
        }));
      });

      it('ignores <mousedown> when out of result range', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const inRangePosition = new _atom.Point(0, 1);
          const outOfRangePosition = new _atom.Point(1, 0);
          const expectedText = 'word1';
          const expectedRange = _atom.Range.fromObject([[0, 0], [0, 5]]);

          dispatch(MouseEvent, 'mousemove', inRangePosition, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

          dispatch(MouseEvent, 'mousemove', outOfRangePosition, {
            metaKey: true
          });
          dispatch(MouseEvent, 'mousedown', outOfRangePosition, {
            metaKey: true
          });
          expect(callback.callCount).toBe(0);
        }));
      });

      it('ignores <mousemove> when past the end of the line', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const provider = {
            providerName: 'test',
            getSuggestion(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback() {} };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestion').andCallThrough();
          hyperclick.addProvider(provider);

          const outOfRangePosition = new _atom.Point(0, 20);
          dispatch(MouseEvent, 'mousemove', outOfRangePosition, {
            metaKey: true
          });
          expect(provider.getSuggestion).not.toHaveBeenCalled();
        }));
      });
    });

    describe('adds the `hyperclick` CSS class', () => {
      const provider = {
        providerName: 'test',
        getSuggestionForWord(sourceTextEditor, text, range) {
          return (0, _asyncToGenerator.default)(function* () {
            return { range, callback() {} };
          })();
        },
        priority: 0
      };

      beforeEach(() => {
        hyperclick.addProvider(provider);
      });

      it('adds on <meta-mousemove>, removes on <meta-mousedown>', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const position = new _atom.Point(0, 1);

          expect(textEditorView.classList.contains('hyperclick')).toBe(false);

          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(textEditorView.classList.contains('hyperclick')).toBe(true);

          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
          expect(textEditorView.classList.contains('hyperclick')).toBe(false);
        }));
      });

      it('adds on <meta-keydown>, removes on <meta-keyup>', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const position = new _atom.Point(0, 1);

          // We need to move the mouse once, so Hyperclick knows where it is.
          dispatch(MouseEvent, 'mousemove', position);
          expect(textEditorView.classList.contains('hyperclick')).toBe(false);

          dispatch(KeyboardEvent, 'keydown', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(textEditorView.classList.contains('hyperclick')).toBe(true);

          dispatch(KeyboardEvent, 'keyup', position);
          expect(textEditorView.classList.contains('hyperclick')).toBe(false);
        }));
      });
    });

    describe('hyperclick:confirm-cursor', () => {
      it('confirms the suggestion at the cursor even if the mouse moved', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const mousePosition = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();

          textEditor.setCursorBufferPosition(new _atom.Point(0, 8));
          atom.commands.dispatch(textEditorView, 'hyperclick:confirm-cursor');
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, 'word2', _atom.Range.fromObject([[0, 6], [0, 11]]));
          waitsFor(function () {
            return callback.callCount === 1;
          });
        }));
      });
    });

    describe('priority', () => {
      it('confirms higher priority provider when it is consumed first', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback1 = jasmine.createSpy('callback');
          const provider1 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback1 };
              })();
            },
            priority: 5
          };
          hyperclick.addProvider(provider1);

          const callback2 = jasmine.createSpy('callback');
          const provider2 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback1 };
              })();
            },
            priority: 3
          };
          hyperclick.addProvider(provider2);

          const mousePosition = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

          expect(callback1.callCount).toBe(1);
          expect(callback2.callCount).toBe(0);
        }));
      });

      it('confirms higher priority provider when it is consumed last', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback1 = jasmine.createSpy('callback');
          const provider1 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback1 };
              })();
            },
            priority: 3
          };
          hyperclick.addProvider(provider1);

          const callback2 = jasmine.createSpy('callback');
          const provider2 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback2 };
              })();
            },
            priority: 5
          };
          hyperclick.addProvider(provider2);

          const mousePosition = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

          expect(callback1.callCount).toBe(0);
          expect(callback2.callCount).toBe(1);
        }));
      });

      it('confirms same-priority in the order they are consumed', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback1 = jasmine.createSpy('callback');
          const provider1 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback1 };
              })();
            },
            priority: 0
          };
          hyperclick.addProvider(provider1);

          const callback2 = jasmine.createSpy('callback');
          const provider2 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback2 };
              })();
            },
            priority: 0
          };
          hyperclick.addProvider(provider2);

          const mousePosition = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

          expect(callback1.callCount).toBe(1);
          expect(callback2.callCount).toBe(0);
        }));
      });

      it('confirms highest priority provider when multiple are consumed at a time', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback1 = jasmine.createSpy('callback');
          const provider1 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback1 };
              })();
            },
            priority: 1
          };
          const callback2 = jasmine.createSpy('callback');
          const provider2 = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback: callback2 };
              })();
            },
            priority: 2
          };

          hyperclick.addProvider([provider1, provider2]);

          const mousePosition = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

          expect(callback1.callCount).toBe(0);
          expect(callback2.callCount).toBe(1);
        }));
      });
    });

    describe('multiple suggestions', () => {
      it('confirms the first suggestion', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = [{
            title: 'callback1',
            callback: jasmine.createSpy('callback1')
          }, {
            title: 'callback2',
            callback: jasmine.createSpy('callback1')
          }];
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });

          const suggestionListEl = textEditorView.querySelector('hyperclick-suggestion-list');
          expect(suggestionListEl).toExist();

          atom.commands.dispatch(textEditorView, 'editor:newline');

          expect(callback[0].callback.callCount).toBe(1);
          expect(callback[1].callback.callCount).toBe(0);
          expect(textEditorView.querySelector('hyperclick-suggestion-list')).not.toExist();
        }));
      });

      it('confirms the second suggestion', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = [{
            title: 'callback1',
            callback: jasmine.createSpy('callback1')
          }, {
            title: 'callback2',
            callback: jasmine.createSpy('callback1')
          }];
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });

          const suggestionListEl = textEditorView.querySelector('hyperclick-suggestion-list');
          expect(suggestionListEl).toExist();

          atom.commands.dispatch(textEditorView, 'core:move-down');
          atom.commands.dispatch(textEditorView, 'editor:newline');

          expect(callback[0].callback.callCount).toBe(0);
          expect(callback[1].callback.callCount).toBe(1);
          expect(textEditorView.querySelector('hyperclick-suggestion-list')).not.toExist();
        }));
      });

      it('is cancelable', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = [{
            title: 'callback1',
            callback: jasmine.createSpy('callback1')
          }, {
            title: 'callback2',
            callback: jasmine.createSpy('callback1')
          }];
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          hyperclick.addProvider(provider);

          const position = new _atom.Point(0, 1);
          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          dispatch(MouseEvent, 'mousedown', position, { metaKey: true });

          const suggestionListEl = textEditorView.querySelector('hyperclick-suggestion-list');
          expect(suggestionListEl).toExist();

          atom.commands.dispatch(textEditorView, 'core:cancel');

          expect(callback[0].callback.callCount).toBe(0);
          expect(callback[1].callback.callCount).toBe(0);
          expect(textEditorView.querySelector('hyperclick-suggestion-list')).not.toExist();
        }));
      });
    });
  });

  describe('with line wrapping', () => {
    beforeEach(() => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        atom.config.set('editor.softWrap', true);
        atom.config.set('editor.softWrapAtPreferredLineLength', true);
        atom.config.set('editor.preferredLineLength', 6); // This wraps each word onto its own line.
        yield setup();
      }));
    });

    afterEach(() => {
      hyperclick.dispose();
      // Bug: Atom 1.19+ hangs on teardown if we don't manually detach the DOM.
      atom.workspace.getElement().remove();
    });

    describe('when the editor has soft-wrapped lines', () => {
      it('Hyperclick correctly detects the word being moused over.', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          const callback = jasmine.createSpy('callback');
          const provider = {
            providerName: 'test',
            getSuggestionForWord(sourceTextEditor, text, range) {
              return (0, _asyncToGenerator.default)(function* () {
                return { range, callback };
              })();
            },
            priority: 0
          };
          spyOn(provider, 'getSuggestionForWord').andCallThrough();
          hyperclick.addProvider(provider);

          const position = new _atom.Point(8, 0);
          const expectedText = 'word9';
          const expectedBufferRange = _atom.Range.fromObject([[2, 12], [2, 17]]);
          dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
          yield hyperclickForTextEditor.getSuggestionAtMouse();
          expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedBufferRange);
          expect(provider.getSuggestionForWord.callCount).toBe(1);
        }));
      });
    });
  });
});

describe('showTriggerConflictWarning', () => {
  it('formats the message without erroring', () => {
    (0, (_showTriggerConflictWarning || _load_showTriggerConflictWarning()).default)().dismiss();
  });
});