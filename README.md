## hbsinspect

Forked from [jsinspect](https://github.com/danielstjules/jsinspect)


Detect copy-pasted and structurally similar ember template code. Requires Node.js
6.0+, and supports ES6, JSX as well as Flow. Note: the project has been mostly
rewritten for the 0.10 release and saw several breaking changes.


* [Overview](#overview)
* [Installation](#installation)
* [Usage](#usage)
* [Integration](#integration)
* [Reporters](#reporters)

## Overview

We've all had to deal with code smell, and duplicate code is a common source.
While some instances are easy to spot, this type of searching is the perfect
use-case for a helpful CLI tool.

Existing solutions do exist for this purpose, but some struggle with code
that has wildly varying identifiers or literals, and others have lackluster
support for the JS ecosystem: ES6, JSX, Flow, ignoring module declarations
and imports, etc.

And copy-pasted code is but one type of code duplication. Common boilerplate
and repeated logic can be identified as well using jsinspect, since it
doesn't operate directly on tokens - it uses the ASTs of the parsed code.

You have the freedom to specify a threshold determining the smallest subset of
nodes to analyze. This will identify code with a similar structure, based
on the AST node types, e.g. BlockStatement, VariableDeclaration,
ObjectExpression, etc. By default, it searches nodes with matching identifiers
and literals for copy-paste oriented detection, but this can be disabled.
For context, identifiers include the names of variables, methods, properties,
etc, while literals are strings, numbers, etc.

The tool accepts a list of paths to parse and prints any found matches. Any
directories among the paths are walked recursively, and only `.hbs`
files are analyzed. You can explicitly pass file paths that include a different
extension as well. Any `node_modules` and `bower_components` dirs are also
ignored.

## Installation

It can be installed via `npm` using:

``` bash
npm i -g "hbsinspect@git+ssh://git@github.com/Praveen-Kumaravel/jsinspect-hbs#npm_package"
```

## Usage

```
Usage: hbsinspect [options] <paths ...>


Detect copy-pasted and structurally similar ember template code
Example use: hbsinspect -I -L -t 20 --ignore "test" ./path/to/src


Options:

  -h, --help                         output usage information
  -V, --version                      output the version number
  -t, --threshold <number>           number of nodes (default: 30)
  -M, --mode [strict|loose]          toggles between strict and loose mode. loose mode ignores attribute keys and only focuses on component names and hierarchy.
  -m, --min-instances <number>       min instances for a match (default: 2)
  -c, --config [config]              path to config file (default: .jsinspectrc)
  -r, --reporter [default|json|pmd]  specify the reporter to use
  -I, --no-identifiers               do not match identifiers
  -L, --no-literals                  do not match literals
  -C, --no-color                     disable colors
  --ignore <pattern>                 ignore paths matching a regex
  --truncate <number>                length to truncate lines (default: 100, off: 0)
  --debug                            print debug information
```

If a `.hbsinspectrc` file is located in the project directory, its values will
be used in place of the defaults listed above. For example:

``` javascript
{
  "threshold":     30,
  "identifiers":   true,
  "literals":      true,
  "color":         true,
  "minInstances":  2,
  "ignore":        "test|spec|mock",
  "reporter":      "json",
  "truncate":      100,
}
```

On first use with a project, you may want to run the tool with the following
options, while running explicitly on the lib/src directories, and not the
test/spec dir.

```
hbsinspect -t 50 --ignore "test" ./path/to/src
```

From there, feel free to try decreasing the threshold, ignoring identifiers
using the `-I` flag and ignoring literals with `-L`. A lower threshold may lead
you to discover new areas of interest for refactoring or cleanup.

## Integration

It's simple to run hbsinspect on your library source as part of a build
process. It will exit with an error code of 0 when no matches are found,
resulting in a passing step, and a positive error code corresponding to its
failure. For example, with Travis CI, you could add the following entries
to your `.travis.yml`:

``` yaml
before_script:
  - "npm install -g jsinspect"

script:
  - "jsinspect ./path/to/src"
```

Note that in the above example, we're using a threshold of 30 for detecting
structurally similar code. A higher threshold may be appropriate as well.

To have hbsinspect run with each job, but not block or fail the build, you can
use something like the following:

``` yaml
script:
  - "hbsinspect ./path/to/src || true"
```

## Reporters

Aside from the default reporter, both JSON and PMD CPD-style XML reporters are
available. Note that in the JSON example below, indentation and formatting
has been applied. Furthermore, the id property available in these reporters is
useful for parsing by automatic scripts to determine whether or not duplicate
code has changed between builds.

#### JSON

``` json
[{
  "id":"6ceb36d5891732db3835c4954d48d1b90368a475",
  "instances":[
    {
      "path":"app/components/app-header/template.hbs",
      "lines":[1,5],
      "code":"{{#if isActionCell}}\n  {{#if (has-access privilege=\"appointment_edit\")}}\n    <div class=\"btn-group pull-right flex\">\n      {{#if showActions}}\n      {{fsa-button\n        type=\"button\"\n        btnClass=\"fsa-btn-secondary truncate-right\"\n        btnText=(text-formatter-i18n appointmentRowCTA.label app=appointmentRowCTA.appName truncate=false)\n        svgName=appointmentRowCTA.icon\n        svgClass=\"svg-md mg-r-5\"\n        onclick=(action appointmentRowCTA.actionName appointmentRowCTA.param)}}\n      {{/if}}\n\n      {{#if moreActions.length}}\n          {{#basic-dropdown horizontalPosition=(if (is-RTL) 'left' 'right') as |dd|}}\n              {{#dd.trigger class=\"pull-right\"}}\n                {{fsa-button\n                  type=\"button\"\n                  btnClass=dropDownClass\n                  svgName=\"icon-ellipsis-v\"\n                  svgClass=\"svg-md\"\n                  data-test-more-actions=true}}\n              {{/dd.trigger}}\n\n              {{#dd.content class=\"basic-dropdown-menu fsa-dropdown-menu home-page--dropdown\"}}\n                {{#each moreActions as |actionInfo|}}\n                  {{#if actionInfo.isDivider}}\n                      <li class=\"divider\"></li>\n                  {{else if actionInfo.targetableActions}}\n                    {{module-dashboard/home-page/entity-common-actions targetable=targetable showDivider=(not isCompleted) dd=dd activityType='Appointment' activity=model calculatePosition=(action \"getPosition\" (is-RTL))}}\n                  {{else}}\n\n                    {{#if actionInfo.children}}\n\n                      {{child-dropdown data = actionInfo onItemClick = (action \"snooze\") calculatePosition=(action \"getPosition\" (is-RTL)) renderInPlace=true}}\n\n                    {{else}}\n                    <li {{action \"invokeAction\" actionInfo.actionName}} class=\"menu-item icon-shade-default\">\n                        {{svg-jar actionInfo.icon class=\"svg-md mg-r-10\"}}\n                          <span class=\"icon-align\">\n                            {{text-formatter-i18n actionInfo.label truncate=true width=\"400px\"}}\n                          </span>\n                      </li>\n                    {{/if}}\n                  {{/if}}\n                {{/each}}\n              {{/dd.content}}\n            {{/basic-dropdown}}\n      {{/if}}\n    </div>"
    },
    {
      "path":"app/components/app-header/template.hbs",
      "lines":[7,11],
      "code":"{{#if isActionCell}}\n{{#if (has-access privilege='sales_activity_edit')}}\n  <div class=\"btn-group pull-right flex\">\n    {{#if showActions}}\n    {{fsa-button\n    type=\"button\"\n    btnClass=\"fsa-btn-secondary truncate-right\"\n    btnText=(t salesActivityCTA.label)\n    svgName=salesActivityCTA.icon\n    svgClass=\"svg-md mg-r-5\"\n    onclick=(action salesActivityCTA.actionName salesActivityCTA.param)}}\n    {{/if}}\n\n    {{#if moreActions.length}}\n        {{#basic-dropdown horizontalPosition=(if (is-RTL) 'left' 'right') as |dd|}}\n            {{#dd.trigger class=\"pull-right\"}}\n              {{fsa-button\n                type=\"button\"\n                btnClass=dropDownClass\n                svgName=\"icon-ellipsis-v\"\n                svgClass=\"svg-md\"\n                data-test-more-actions=true}}\n            {{/dd.trigger}}\n\n            {{#dd.content class=\"basic-dropdown-menu fsa-dropdown-menu home-page--dropdown\"}}\n              {{#each moreActions as |actionInfo|}}\n                {{#if actionInfo.isDivider}}\n                    <li class=\"divider\"></li>\n                {{else if actionInfo.targetableActions}}\n                    {{module-dashboard/home-page/entity-common-actions targetable=targetable showDivider=(not isCompleted) dd=dd activityType='SalesActivity' activity=model calculatePosition=(action \"getPosition\" (is-RTL))}}\n                {{else}}\n                  {{#if actionInfo.children}}\n                    {{child-dropdown data = actionInfo onItemClick = (action \"snooze\") calculatePosition=(action \"getPosition\" (is-RTL)) renderInPlace=true}}\n                  {{else}}\n                  <li {{action \"invokeAction\" actionInfo.actionName}} class=\"menu-item icon-shade-default\">\n                      {{svg-jar actionInfo.icon class=\"svg-md mg-r-10\"}}\n                        <span class=\"icon-align\">\n                          {{text-formatter-i18n actionInfo.label truncate=true width=\"400px\"}}\n                        </span>\n                    </li>\n                  {{/if}}\n                {{/if}}\n              {{/each}}\n            {{/dd.content}}\n          {{/basic-dropdown}}\n    {{/if}}\n  </div>"
    }
  ]
}]
```

#### PMD CPD XML

``` xml
<?xml version="1.0" encoding="utf-8"?>
<pmd-cpd>
<duplication lines="10" id="6ceb36d5891732db3835c4954d48d1b90368a475">
<file path="/jsinspect/app/components/app-header/template.hbs" line="1"/>
<file path="/jsinspect/app/components/app-header/template.hbs" line="7"/>
<codefragment>
app/components/app-header/template.hbs:1,5
{{#if isActionCell}}
  {{#if (has-access privilege="appointment_edit")}}
    <div class="btn-group pull-right flex">
      {{#if showActions}}
      {{fsa-button
        type="button"
        btnClass="fsa-btn-secondary truncate-right"
        btnText=(text-formatter-i18n appointmentRowCTA.label app=appointmentRowCTA.appName truncate=false)
        svgName=appointmentRowCTA.icon
        svgClass="svg-md mg-r-5"
        onclick=(action appointmentRowCTA.actionName appointmentRowCTA.param)}}
      {{/if}}

      {{#if moreActions.length}}
          {{#basic-dropdown horizontalPosition=(if (is-RTL) 'left' 'right') as |dd|}}
              {{#dd.trigger class="pull-right"}}
                {{fsa-button
                  type="button"
                  btnClass=dropDownClass
                  svgName="icon-ellipsis-v"
                  svgClass="svg-md"
                  data-test-more-actions=true}}
              {{/dd.trigger}}

              {{#dd.content class="basic-dropdown-menu fsa-dropdown-menu home-page--dropdown"}}
                {{#each moreActions as |actionInfo|}}
                  {{#if actionInfo.isDivider}}
                      <li class="divider"></li>
                  {{else if actionInfo.targetableActions}}
                    {{module-dashboard/home-page/entity-common-actions targetable=targetable showDivider=(not isCompleted) dd=dd activityType='Appointment' activity=model calculatePosition=(action "getPosition" (is-RTL))}}
                  {{else}}

                    {{#if actionInfo.children}}

                      {{child-dropdown data = actionInfo onItemClick = (action "snooze") calculatePosition=(action "getPosition" (is-RTL)) renderInPlace=true}}

                    {{else}}
                    <li {{action "invokeAction" actionInfo.actionName}} class="menu-item icon-shade-default">
                        {{svg-jar actionInfo.icon class="svg-md mg-r-10"}}
                          <span class="icon-align">
                            {{text-formatter-i18n actionInfo.label truncate=true width="400px"}}
                          </span>
                      </li>
                    {{/if}}
                  {{/if}}
                {{/each}}
              {{/dd.content}}
            {{/basic-dropdown}}
      {{/if}}
    </div>

app/components/app-header/template.hbs:7,11
{{#if isActionCell}}
{{#if (has-access privilege='sales_activity_edit')}}
  <div class="btn-group pull-right flex">
    {{#if showActions}}
    {{fsa-button
    type="button"
    btnClass="fsa-btn-secondary truncate-right"
    btnText=(t salesActivityCTA.label)
    svgName=salesActivityCTA.icon
    svgClass="svg-md mg-r-5"
    onclick=(action salesActivityCTA.actionName salesActivityCTA.param)}}
    {{/if}}

    {{#if moreActions.length}}
        {{#basic-dropdown horizontalPosition=(if (is-RTL) 'left' 'right') as |dd|}}
            {{#dd.trigger class="pull-right"}}
              {{fsa-button
                type="button"
                btnClass=dropDownClass
                svgName="icon-ellipsis-v"
                svgClass="svg-md"
                data-test-more-actions=true}}
            {{/dd.trigger}}

            {{#dd.content class="basic-dropdown-menu fsa-dropdown-menu home-page--dropdown"}}
              {{#each moreActions as |actionInfo|}}
                {{#if actionInfo.isDivider}}
                    <li class="divider"></li>
                {{else if actionInfo.targetableActions}}
                    {{module-dashboard/home-page/entity-common-actions targetable=targetable showDivider=(not isCompleted) dd=dd activityType='SalesActivity' activity=model calculatePosition=(action "getPosition" (is-RTL))}}
                {{else}}
                  {{#if actionInfo.children}}
                    {{child-dropdown data = actionInfo onItemClick = (action "snooze") calculatePosition=(action "getPosition" (is-RTL)) renderInPlace=true}}
                  {{else}}
                  <li {{action "invokeAction" actionInfo.actionName}} class="menu-item icon-shade-default">
                      {{svg-jar actionInfo.icon class="svg-md mg-r-10"}}
                        <span class="icon-align">
                          {{text-formatter-i18n actionInfo.label truncate=true width="400px"}}
                        </span>
                    </li>
                  {{/if}}
                {{/if}}
              {{/each}}
            {{/dd.content}}
          {{/basic-dropdown}}
    {{/if}}
  </div>
</codefragment>
</duplication>
</pmd-cpd>
```
