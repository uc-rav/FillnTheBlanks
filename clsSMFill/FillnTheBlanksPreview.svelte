<script>
    import { onMount } from 'svelte';
    import { XMLToJSON } from './HelperAI.svelte';

    let myData = document.getElementById("special_module_xml").value;

    let obj = XMLToJSON(myData);
    let string = obj.smxml.text.__cdata; 
    let array = string.match(/[%{](.*?)[%]/g);
    console.log("preview section", array);
    let newString = string.replace(/[%{](.*?)[%]/g,`<input type="text"
    placeholder="Textbox" class="textarea" style="border-radius: 5px; margin: 5px;
    border-left: 5px solid #d9e7fd; background-color: #f1f1f1; width: 150px; 
    height: 30px;" autocomplete="off"/>`);

    let listItem = [];
    onMount(() => {
        listItem = document.querySelectorAll('.textarea');
        for(let i = 0 ; i < listItem.length ; i++) {
            listItem[i].setAttribute("id",`input${i}`);
        }
    });
    let flag = false;
    function checkAnswer() {
        for(let i = 0 ; i < listItem.length ; i ++) {
            if(flag) {
                listItem[i].value ='';
            } else {
                if(array[i] !== `%{${listItem[i].value}}%`) {
                    listItem[i].style.border = "2px solid red";
                } else {
                    listItem[i].style.border = "2px solid green";
                }
            }
        }
    }
    function correctAnswer() { 
        flag = true;
        for(let i = 0 ; i < listItem.length ; i++) {
            listItem[i].value = array[i].replace(/[^a-zA-Z]/g,"");
            listItem[i].style.border = "none";
        }
    }
</script>

<style>
    #FillnTheBlanksPreview {
        position: fixed;
        top: calc(55% - 150px);
        left: 5rem;
        right: 5rem;
        height: 300px;
        background-color: rgb(255, 255, 255);
        border: 2px solid #d9e7fd;
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.6) 0px 5px 15px;
    }
    #FillnTheBlanksPreview_Header {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #d9e7fd;
        height: 2.5rem;
    }
    #FillnTheBlanksPreview_Body {
        outline: 0px solid transparent;
        padding: 1rem;
    }
    button {
        width: 150px;
        height: 2rem;
        border: none;
        padding: 5px;
        margin: 0.25rem 0rem 0.25rem 0.5rem;
        background-color: #f1f1f1;
        border-radius: 5px;
        border: 1px solid grey;
    }
</style>

<div id="FillnTheBlanksPreview">
    <div id="FillnTheBlanksPreview_Header">
        <button type="button" on:click={correctAnswer}>Correct Answer</button>
        <button type="button" on:click={checkAnswer}>Review Answer</button>
    </div>
    <div id="FillnTheBlanksPreview_Body">
        {@html newString}
    </div>
</div>