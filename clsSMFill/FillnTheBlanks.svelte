<script>
    import { onMount } from 'svelte';
    import { getDefaultXMl } from './defaultXML.svelte';
    import { XMLToJSON,JSONToXML } from './HelperAI.svelte';

    let myData = getDefaultXMl("editor_item_1.xml");
    document.getElementById('special_module_xml').value = myData;

    let obj = XMLToJSON(myData);
    console.log("obj",obj);
    let matching = obj.smxml.text.__cdata;
    
    //console.log("myData",myData);
    //console.log("question",matching);
    let array = [];
    $: array = matching.match(/[%{](.*?)[%]/g); //%{string}%
    //console.log(array);
    //console.log(array[0]);
    //console.log(matching.match(/[%{](.*?)[%]/g));//%{ string }%

    //replace the matching string with span tag
    let newString = matching.replace(/[%{](.*?)[%]/g,`<span class="textarea" 
    style="display: inline-block; padding: 5px 10px 5px 10px;
    border-radius: 5px; margin: 5px; border-left: 5px solid #d9e7fd;
    background-color: #f1f1f1; width: 100px;">Textbox</span>`);
    //console.log(newString);


    //  onMount we add a class to span tag and addEventListner
    onMount(() => {
        let mylist = document.querySelectorAll(".textarea");
        //console.log(mylist);
        for(let i = 0 ; i < mylist.length ;  i++) {
            mylist[i].addEventListener("click", () => {
                addRecord(array[i]);
            });
        }

        //console.log("myList",mylist[0].innerHTML);
    });

    //context-menu 
    window.addEventListener("contextmenu",function(event) {
        event.preventDefault();
        console.log(event)
        let contextElement = document.getElementById("context-menu");
        contextElement.style.top = event.clientY + "px";
        console.log(event.offsetY);
        contextElement.style.left = event.clientX + "px";
        console.log(event.offsetX);
        contextElement.style.display = "block";
        contextElement.style.transform = "scale(1)";
        contextElement.style.transition = "transform 200ms ease-in-out";
    });

    // when we click on exit button is will change the display property to none
    function exitContext() {
        document.getElementById("context-menu").style.display = "none";
    }

    //if we click on particular span tag
    //is value is updated then is will call updateXml function
    //%{human}%
    function addRecord(myitem) {
        console.log("myItem",myitem);
        let item = myitem.replace(/[^a-zA-Z]/g,"");
        console.log(item);
        // let cursorPos = document.getElementById(FillnTheBlanks_Body).caret().start();
        // console.log("mycursor position",cursorPos);
        document.getElementById("context-menu").style.display = "none";
        swal({
            title: "Add Responce",
            text: "Write correct answer here!",
            content: {
                element: "input",
                attributes: {
                    value: item
                }
            },
            buttons: ["Cancel","Done"],
            className: "sweetAlert"
        }).then((value) => {
            console.log("VAlue",value);
            // if(value) {
            //     updateXML(value);
            // }
            if(value.trim()!='') {
                if(value.match(/[a-zA-Z]/)) {
                    updateXML(value);
                } else {
                    alert("Invalid string");
                }
            } else {
                alert("Invalid string");
            }
        });

        //this function will update the XML
        function updateXML(value) {
            if(value.trim() != "") {
                let string = matching.replace(myitem,`%{${value}}%`);
                obj.smxml.text.__cdata = string;
                matching = string;
                //console.log(matching);
                let obj1 = JSONToXML(obj);
                //console.log("myboject",obj1);
                myData = obj1;
                document.getElementById('special_module_xml').value = myData;
            } else {
                alert("Invalid Input");
            }
        }
    }
</script>

<style>
    #FillnTheBlanks {
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
    #FillnTheBlanks_Header {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #d9e7fd;
        height: 2.5rem;
    }
    #FillnTheBlanks_Body {
        outline: 0px solid transparent;
        padding: 1rem;
    }

    /*Custom context Menu*/
    #context-menu {
        position: fixed;
        z-index: 10000;
        width: 150px;
        background-color: #e5e4e2;
        padding: 0.2rem;
        border-radius: 5px;
        transform: scale(0);
        transform-origin: top left;
    }
    #context-menu hr {
        margin: 0.2rem 0px 0.1rem 0;
        border: 0;
        height: 1px;
        background: #333;
        background-image: linear-gradient(to right, #ccc, #333, #ccc);
    }
    #context-menu .items i {
        font-size: 1.7rem;
        margin-right: 0.2rem;
    }
    #context-menu .items span{
        position: absolute;
        margin-top: 2px;
    }
    #context-menu .items {
        background-color: #e5e4e2;
        transition: all .2s;
    }
    #context-menu .items:hover {
        background-color: silver;
        transition: all .2s;
        border-radius: 5px;
    }
</style>

<nav id="navbar">  
</nav>
<div id="FillnTheBlanks" >
    <div id="FillnTheBlanks_Header">
    </div>
    <div id="FillnTheBlanks_Body" role="textbox" contenteditable="false" spellcheck="false" class="myDiv"> 
        {@html newString}       
        <!-- Custom context-menu -->
        <div id="context-menu" contenteditable="false">
            <div class="items" id="addResponce">
                <i class='bx bxs-plus-square'></i><span>Add Responce</span>
            </div>
            <hr>
            <div class="items" id="exitTab" on:click={exitContext}>
                <i class='bx bxs-exit' ></i><span>Exit</span>
            </div>
        </div>
        
    </div>
</div>