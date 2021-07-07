const functions = require('./index');

// FillnTheBlanks.svelte
    // 1) AddRecord() :
            //a) %{ ... }% should be removed from listItem
            test("List item should be in the form of %{string}%", () => {
                expect(functions.addRecord('%{string}%')).toBe('string');
            });
            //b) If not updated return Null.
            //c) If Updated return value of input field.
            //d) Input field can be empty. 
                    //if empty : take pervious default value.
                    //else : take entered value.
    // 2) UpdateXml() :
            //a) Value can not be empty.
                test("value can not be empty", () => {
                    expect(functions.updateXml('string')).not.toBe("");
                });
                    //if empty : message of invalid input
                    test("Message of invalid input", () => {
                        expect(functions.emptyValue("")).toBeNull();
                    });
                    //else : update XML.
                    test("concat %{ ... }% to the value", () => {
                        expect(functions.concatValue('string')).toBe("%{string}%");
                    });
// FillnTheBlanksPreview.svelte
    //1) checkAnswer() :
            //if incorrect : change border to red
            //else : change border to green
    //2) correctANswer() :
            // show correst answer in the textbox after replacing %{ ... }% from the string 
    
// Editor.svelte 
    //1) showXml() :
            // show updated XML
                    // if "Done" is clicked : return true
                    // if "Cancel" is clicked : return null
