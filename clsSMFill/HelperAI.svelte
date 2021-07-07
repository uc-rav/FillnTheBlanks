<script context="module"> 
    import X2JS from "../scripts/editorScript/xml2json";
    
    export function XMLToJSON(myXml) {
        //var myXml = xml;
        myXml = myXml.replace(/<\!--\[CDATA\[/g, "<![CDATA[").replace(/\]\]-->/g, "]]>");
        let x2js = new X2JS({
            useDoubleQuotes: true
        });
        let newXml = JSON.stringify(x2js.xml_str2json(myXml));
        newXml = newXml.replace("SMXML", "smxml");
        newXml = JSON.parse(newXml);
 
        return newXml;
    }
 
    export function JSONToXML(a) {
        let b = new X2JS({
            useDoubleQuotes: !0
        })
        let c = b.json2xml_str(a);
        return c = c.replace("<![CDATA[", "\x3c!--[CDATA[").replace("]]>", "]]--\x3e")
    }
 
    // Accept Object argument with key ans and uXml to store user answer and status
    export function onUserAnsChange(result) {
        if (result) {
            AH.select("#answer", 'checked', result.ans ? true : false);
            AH.select("#special_module_user_xml", 'value', result.uXml);
            if (typeof window == 'object') {
                ISSPECIALMODULEUSERXMLCHANGE = 1;
                if (typeof calculatePoint != "undefined") {
                    calculatePoint(result.correctPoints || 1, result.ansPoint || result.ans);
                }
            }
        }
    }
</script>
