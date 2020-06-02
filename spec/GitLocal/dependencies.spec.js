// MIT License
//
// Copyright 2020 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const eol = require('eol');
const Log = require('log');
const Builder = require('../../src/');

const dependenciesFile = path.join(process.cwd(), 'save_dependencies.json');

describe('Machine', () => {
  let machine;

  beforeEach(function () {
    if (!process.env.SPEC_GIT_LOCAL_REPO_PATH) {
      fail('Some of the required environment variables are not set');
      return;
    }

    const builder = new Builder();
    builder.logger = new Log(process.env.SPEC_LOGLEVEL || 'error');
    machine = builder.machine;
  });

  it('Create and read dependencies JSON file', () => {
    const rev1Hash = "c22db87f08ae30a4a0d3450daabb34029b3d50e7";
    const rev1Content = "// included file a\n// included file b\n\n\n  // should be included\n\n    // l2 else\n\n\n  // should be included\n";
    const rev0Hash = "9db26aa9017943a7812ab6751a699cd1c7247370";
    const rev0Content = "// included file a\n    // included file b\n\n\n      // should be included\n\n        // l2 else\n\n\n      // should be included\n";
    const url = `git-local:${process.env.SPEC_GIT_LOCAL_REPO_PATH}/spec/fixtures/sample-1/input.nut.out@v2.2.2`;

    // ensure that test dependencies JSON file does not exist
    if (fs.existsSync(dependenciesFile)) {
      fs.unlinkSync(dependenciesFile);
    }

    machine.dependenciesSaveFile = dependenciesFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev1Content);

    // check dependencies JSON file content
    const rev1Map = new Map(JSON.parse(fs.readFileSync(dependenciesFile)));
    expect(rev1Map.size).toEqual(1);
    expect(rev1Map.get(url)).toEqual(rev1Hash);

    // replace the actual (rev1) commit ID to rev0 commit ID
    rev1Map.set(url, rev0Hash);
    fs.writeFileSync(dependenciesFile, JSON.stringify([...rev1Map], null, 2), 'utf-8');

    machine.dependenciesUseFile = dependenciesFile;
    expect(eol.lf(machine.execute(`@include "${url}"`))).toBe(rev0Content);

    // check dependencies JSON file content again
    const rev0Map = new Map(JSON.parse(fs.readFileSync(dependenciesFile)));
    expect(rev0Map.size).toEqual(1);
    expect(rev0Map.get(url)).toEqual(rev0Hash);

    // unlink dependencies file to avoid conflicts with unit-tests below
    fs.unlinkSync(dependenciesFile);
  });
});
