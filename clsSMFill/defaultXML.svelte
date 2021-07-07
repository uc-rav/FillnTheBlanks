<script context="module">
    export function getDefaultXMl(type) {
        let xmls = {
            "editor_item_1.xml": '<smxml type="9" name="FillInTheBlank"><text matchtype="1"><![CDATA[Education, then, beyond all other devices of %{human}% origin, is the great equalizer of the %{conditions}% of man.]]></text></smxml>' 
        };
        return xmls[type];
    }
</script>
