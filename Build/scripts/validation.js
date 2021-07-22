// ------------------ LOAD SCRIPTS -------------------
var scripts = ["scripts/chromeRuntime"]
var scriptsLoaded = 0;

function scriptLoaded()
{
    scriptsLoaded++;
    if(scriptsLoaded === scripts.length)
        loaded();
}

scripts.forEach(function(scriptName){
    var script = document.createElement("script");
    script.src = scriptName + ".js";
    script.addEventListener("load", scriptLoaded);
    document.head.appendChild(script);
});
// ------------------ ------------- -------------------

// ------------------ ON LOAD -------------------
OrangeBerry.onLoad.push(onLoad)
function onLoad()
{
    // Validation GOTO
    $(".validation .navigation [class*='fa-angle']").on("click", function(event){
        validate(event.currentTarget.getAttribute("data-goto"));
    });        

    // ReValidate
    $(".validation .navigation .arrows .re-validate").on("click", function(event){
        validate(null, true);
    });   
}
// ------------------ ------------- -------------------

// ------------------ FUNCTIONS -------------------
function clearTable($table)
{
    $table.children().toArray().forEach(function(child) {        
        child.remove();
    });
}

function createTableHeader()
{
    var $header = $("<tr class='header'></tr>");
    $header.append($("<th class='item-number'>#</th>"));
    $header.append($("<th class='property'>Property</th>"));
    $header.append($("<th class='exception'>Exception</th>"));
    return $header;
}

function recreateTable(validationResults, activeIndex) {
    var $fieldsTable = $(".validation .validation-results table.fields tbody");
    var $formTable = $(".validation .validation-results table.form tbody");
    clearTable($fieldsTable);
    clearTable($formTable);

    if(validationResults){                                
        $fieldsTable.append(createTableHeader());
        $formTable.append(createTableHeader());

        var currentIndex = 0;
        Object.keys(validationResults).forEach(function(elementId){
            $table = elementId === "Form"? $formTable : $fieldsTable;
            validationResults[elementId].forEach(function(result){
                if(!result.FormattedValue)
                {
                    var $row = $("<tr class='" + (activeIndex === currentIndex? "selected" : "")+ "' data-uuid='" + elementId + "' data-index='" + currentIndex + "'></tr>");
                    $row.append($("<td class='item-number'>" + (++currentIndex) + "</td>"));
                    $row.append($("<td class='property'>" + result.Property + "</td>"));
                    $row.append($("<td class='exception'>" + result.ExceptionMessage + "</td>"));
                    $table.append($row);
                }
            });        
        });

        setTimeout(function(){
            toggleEmptyMessage($fieldsTable);
            toggleEmptyMessage($formTable);

            // Validation Select
            $(".validation table tr:not('.header')").on("click", function(event){                                
                post("goto", { uuid: event.currentTarget.getAttribute("data-uuid"), index: event.currentTarget.getAttribute("data-index") });
            });
        });
    }
    else {
        if(activeIndex < 0)
            return;
        $fieldsTable.find(".selected").removeClass("selected");
        $fieldsTable.find("[data-index='" + activeIndex + "']").addClass("selected");
    }

    activeIndex = typeof activeIndex !== "number"? parseInt(activeIndex) : activeIndex;
    $(".validation .navigation .index").text(activeIndex + 1);
}

function toggleEmptyMessage($table)
{
    var showMessage = !$table.find("tr:not(.header)").length;
    var messageClass = $table.parent().hasClass("form")? "form" : "fields";
    var $message = $(".validation .validation-results .empty."+ messageClass);

    if(showMessage){
        $table[0].style.display = "none";
        $message[0].style.display = "";
    }
    else {
        $table[0].style.display = "";
        $message[0].style.display = "none";
    }
}

function validate(selector, force)
{
    console.log("validating")
    var $validation = $(".validation");
    if($validation.hasClass("validating"))
    {
        console.log("already validating");
        return;
    }
    
    $validation.addClass("validating");
    $validation.removeClass("no-errors");
    $validation.find(".arrows .index")[0].style.display = "none";
    $validation.find(".arrows .re-validate")[0].style.opacity = 0;

    post("goto", { selector, force });    
}
// ------------------ ------------- -------------------

// ------------------ EVENTS -------------------
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {    
    if(request.msg !== "validationComplete")
        return;

    if(request.data) {
        var results = $.parseJSON(request.data.results);
        var index = request.data.index;

        console.log("validationComplete")
        console.log(results)
        console.log(index)

        recreateTable(results, index);
    } 
    else {        
        recreateTable();
    }

    setTimeout(function(){
        var $validation = $(".validation");
        $validation.removeClass("validating");            
        $validation.find(".arrows .index")[0].style.display = "";
        $validation.find(".arrows .re-validate")[0].style.opacity = 1;
        var $arrows = $validation.find(".navigation .arrows");
        if(!request.data) {
            $validation.addClass("no-errors");
            $arrows[0].style.marginLeft = "";
        }
        else {        
            $arrows[0].style.marginLeft = index || index === 0? (index >= 9? "24%" : "26%") : "28%";
        }
    });
});
// ------------------ ------------- -------------------