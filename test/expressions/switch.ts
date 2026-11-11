import {expect} from "chai";
import {ABAP, MemoryConsole} from "../../packages/runtime/src";
import {AsyncFunction, runFiles} from "../_utils";

let abap: ABAP;

async function run(contents: string, skipVersionCheck = false) {
  return runFiles(abap, [{filename: "zfoobar_switch.prog.abap", contents}], {skipVersionCheck});
}

describe("Running expressions - SWITCH", () => {

  beforeEach(async () => {
    abap = new ABAP({console: new MemoryConsole()});
  });

  it("basic", async () => {
    const code = `
FORM foo.
  DATA(lv_name) = SWITCH string(
    'sdf' WHEN 'sdf' THEN 'foo' WHEN 'bar' THEN 'bar' ).
  WRITE / lv_name.
ENDFORM.

START-OF-SELECTION.
  PERFORM foo.`;
    const js = await run(code);
    const f = new AsyncFunction("abap", js);
    await f(abap);
    expect(abap.console.get()).to.equal("foo");
  });

  it("fallthrough", async () => {
    const code = `
FORM foo.
  DATA(lv_name) = SWITCH string(
    '1' WHEN 'sdf' THEN 'foo' WHEN 'bar' THEN 'bar' ).
  WRITE / lv_name.
ENDFORM.

START-OF-SELECTION.
  PERFORM foo.`;
    const js = await run(code);
    const f = new AsyncFunction("abap", js);
    await f(abap);
    expect(abap.console.get()).to.equal("");
  });

  it("OR", async () => {
    const code = `
FORM foo.
  DATA(lv_name) = SWITCH string(
    '1' WHEN 'sdf' OR '1' THEN 'foo' WHEN 'bar' THEN 'bar' ).
  WRITE / lv_name.
ENDFORM.

START-OF-SELECTION.
  PERFORM foo.`;
    const js = await run(code);
    const f = new AsyncFunction("abap", js);
    await f(abap);
    expect(abap.console.get()).to.equal("foo");
  });

  it("ELSE", async () => {
    const code = `
FORM foo.
  DATA(lv_name) = SWITCH string(
    '1' WHEN 'sdf' THEN 'foo' WHEN 'bar' THEN 'bar' ELSE 'baz' ).
  WRITE / lv_name.
ENDFORM.

START-OF-SELECTION.
  PERFORM foo.`;
    const js = await run(code);
    const f = new AsyncFunction("abap", js);
    await f(abap);
    expect(abap.console.get()).to.equal("baz");
  });

  it("ELSE, last WHEN matches", async () => {
    const code = `
FORM foo.
  DATA(lv_name) = SWITCH string(
    'bar' WHEN 'sdf' THEN 'foo' WHEN 'bar' THEN 'bar' ELSE 'baz' ).
  WRITE / lv_name.
ENDFORM.

START-OF-SELECTION.
  PERFORM foo.`;
    const js = await run(code);
    const f = new AsyncFunction("abap", js);
    await f(abap);
    expect(abap.console.get()).to.equal("bar");
  });


  it("THROW", async () => {
    const code = `
CLASS cx_root DEFINITION ABSTRACT.
  PUBLIC SECTION.
    METHODS constructor.
ENDCLASS.
CLASS cx_root IMPLEMENTATION.
  METHOD constructor.
  ENDMETHOD.
ENDCLASS.

CLASS lcx DEFINITION INHERITING FROM cx_root.
  PUBLIC SECTION.
    DATA value TYPE i.
    METHODS constructor IMPORTING value TYPE i OPTIONAL.
ENDCLASS.
CLASS lcx IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    me->value = value.
  ENDMETHOD.
ENDCLASS.

FORM run USING iv TYPE i.
  DATA lv TYPE i.
  DATA lx TYPE REF TO lcx.
  TRY.
      lv = SWITCH #( iv WHEN 1 THEN 10 WHEN 2 OR 3 THEN THROW lcx( value = iv ) ELSE THROW lcx( ) ).
      WRITE / lv.
    CATCH lcx INTO lx.
      WRITE / lx->value.
  ENDTRY.
ENDFORM.

START-OF-SELECTION.
  PERFORM run USING 1.
  PERFORM run USING 3.
  PERFORM run USING 4.`;
    const js = await run(code);
    const f = new AsyncFunction("abap", js);
    await f(abap);
    expect(abap.console.get()).to.equal("10\n3\n0");
  });

});