//全局变量 
var map;                            // 地图实例
var MarkerList = [];                // 锚点列表
var GlobalMarker;                   // 鼠标悬停临时显示Marker
var StartMarkers = [];
var EndMarkers = [];
var RouteLines = [];

/*
    ****************************** Begin Register HtML Event ******************************
 */
document.getElementById('SearchButton').onclick = function(){
    var Keyword = document.getElementById('SearchInput').value;
    KeywordSearch(Keyword, "杭州市")
}

document.getElementById("Draw").onclick = function(){
    map.remove(StartMarkers)
    map.remove(EndMarkers)
    map.remove(RouteLines)
    var SearchResultTable = document.getElementById("TargetTable");
    if (SearchResultTable.rows.length < 2)
    {
        return
    }
    for (var i = 1; i < SearchResultTable.rows.length - 1; ++i)
    {
        var Row = SearchResultTable.rows[i];
        var Location = Row.getAttribute("Location").split(",")
        var NextRow = SearchResultTable.rows[i + 1];
        var NextLocation = NextRow.getAttribute("Location").split(",")
        QueryDrivePath(Location, NextLocation)
    }
}

/*
    ****************************** End Register HtML Event ******************************
 */

function InitMap()
{
    map = new AMap.Map("container", {
        resizeEnable: true
    }) 
}

function InitToolbar()
{
    document.write("<script type='text/javascript' src='https://cache.amap.com/lbs/static/addToolbar.js'></script>");
    document.write("<script type='text/javascript' src='https://cache.amap.com/lbs/static/PlaceSearchRender.js'></script>");
}

// 关键字查询
function KeywordSearch(Keyword, CityName)
{
    AMap.service(["AMap.PlaceSearch"], function(){
        var PlaceSearch = new AMap.PlaceSearch({
            //city
            city: CityName
        })
        PlaceSearch.search(Keyword, function (status, result){
            ShowSearchResult(result)
           //console.log(result)
        })
    })
}

// 查询驾车路线
function QueryDrivePath(StartPoint, EndPoint)
{
    var DrivingOption = {
        policy: AMap.DrivingPolicy.LEAST_TIME,
    }
    var Driving = new AMap.Driving(DrivingOption)
    Driving.search(StartPoint, EndPoint, function(status, result){
        if (status == 'complete')
        {
            if (result.routes && result.routes.length){
                // 绘制路线
                DrawRoute(result.routes[0])
            }
        }
        else
        {
            console.log("查询失败")
        }
    })
}

function DrawRoute(Route)
{
    var path = parseRouteToPath(Route)
    var startMarker = new AMap.Marker({
        position: path[0],
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
        map: map
    })
    var endMarker = new AMap.Marker({
        position: path[path.length - 1],
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
        map: map
    })
    var routeLine = new AMap.Polyline({
        path: path,
        isOutline: true,
        outlineColor: '#ffeeee',
        borderWeight: 2,
        strokeWeight: 5,
        strokeColor: '#0091ff',
        lineJoin: 'round'
    })

    routeLine.setMap(map)
    map.setFitView([ startMarker, endMarker, routeLine ])
    StartMarkers.push(startMarker)
    EndMarkers.push(endMarker)
    RouteLines.push(routeLine)
}

// 解析DrivingRoute对象，构造成AMap.Polyline的path参数需要的格式
// DrivingResult对象结构参考文档 https://lbs.amap.com/api/javascript-api/reference/route-search#m_DriveRoute
function parseRouteToPath(route) {
    var path = []

    for (var i = 0, l = route.steps.length; i < l; i++) {
        var step = route.steps[i]

        for (var j = 0, n = step.path.length; j < n; j++) {
            path.push(step.path[j])
        }
    }
    console.log(path)
    return path
}

// 显示搜索结果
function ShowSearchResult(Result)
{
    ClearSearchResult()
    var POIs = Result.poiList.pois
    var SearchResultTable = document.getElementById("SearchResultTable");
    for (var i = 0; i < POIs.length; ++i) 
    {
        var Rows = SearchResultTable.insertRow(i + 1);
        var Name = Rows.insertCell(0);
        Name.innerHTML = POIs[i].name
        var AddressName = Rows.insertCell(1);
        AddressName.innerHTML = POIs[i].address
        var AddButton = Rows.insertCell(2);
        var Button = document.createElement("button")
        Button.innerText = "添加"
        Button.type = "button"
        Button.setAttribute("ID", "SearchResult" + i)
        Button.setAttribute("Location", POIs[i].location)
        Button.setAttribute("Name", POIs[i].name)
        Button.setAttribute("Address", POIs[i].address)
        Button.setAttribute("onclick", "AddTargetLocation("+ i +")")
        AddButton.innerHTML = Button.outerHTML

        Rows.setAttribute("ID", "SearchResultRow" + i)
        Rows.setAttribute("Location", POIs[i].location)
        Rows.setAttribute("Address", POIs[i].address)
        Rows.setAttribute("onmouseover", "ShowMarker("+ i +")")
    }
}

// 将选定的搜索结果添加到目标列表中
function AddTargetLocation(Index)
{
    var Button = document.getElementById("SearchResult" + Index)
    var Name = Button.getAttribute("Name")              // 名字
    var Location = Button.getAttribute("Location").split(",")   //坐标
    var TargetTable = document.getElementById("TargetTable")
    var RowsLength = TargetTable.rows.length - 1
    var Rows = TargetTable.insertRow(RowsLength + 1)
    // 关键字
    var Name = Rows.insertCell(0);
    Name.innerHTML = Button.getAttribute("Name")
    // 地址
    var TargetPoint = Rows.insertCell(1);
    TargetPoint.innerHTML = Button.getAttribute("Address")
    // 移除按钮
    var AddButton = Rows.insertCell(2);
    var NewButton = document.createElement("button");
    NewButton.innerText = "移除";
    NewButton.type = "button";
    NewButton.setAttribute("onclick", "RemoveMarker(" + RowsLength + ")");
    AddButton.innerHTML = NewButton.outerHTML

    Rows.setAttribute("Location", Button.getAttribute("Location"))
    Rows.setAttribute("ID", "RemoveRow" + RowsLength);

    AddMarker(Name, Location)
}

/* 添加锚点
 * @Name 名称
 * @Location 经纬度一维数组
 */
function AddMarker(Name, Location)
{
    Marker = new AMap.Marker({
        position: Location,
        title: Name,
        map: map,
        //image: '' //icon图像
        //icon:     //icon实例可与image互相代替
    });
    map.add(Marker);
    MarkerList.push(Marker);
}

// 移除锚点
function RemoveMarker(Index)
{
    var Table = document.getElementById("TargetTable")
    var CurRow = document.getElementById("RemoveRow" + Index)
    for(var i = 0; i < Table.rows.length; ++i)
    {
        if (Table.rows[i] == CurRow)
        {
            map.remove(MarkerList[i - 1])
            Table.deleteRow(i)
            MarkerList.splice(i - 1, 1)
        }
    }
    // Table.deleteRow(Index + 1)
    // map.remove(MarkerList[Index])
    // MarkerList.splice(Index, 1);
}

// 显示临时锚点
function ShowMarker(Index)
{
    if (!(GlobalMarker === undefined))
    {
        map.remove(GlobalMarker)
    }
    var Location = document.getElementById("SearchResultRow" + Index).getAttribute("Location").split(",")
    GlobalMarker = new AMap.Marker({
        position: Location,
    })
    map.add(GlobalMarker)
}

// 清楚搜索结果
function ClearSearchResult()
{
    var SearchResultTable = document.getElementById("SearchResultTable");
    for (var i = SearchResultTable.rows.length - 1; i > 0; --i)
    {
        SearchResultTable.deleteRow(i)
    }
}

// function KeywordSearch(Keyword)
// {
//     AMap.service(["AMap.PlaceSearch"], function() {
//         //构造地点查询类
//         var placeSearch = new AMap.PlaceSearch({ 
//             pageSize: 5, // 单页显示结果条数
//             pageIndex: 1, // 页码
//             //city: "010", // 兴趣点城市
//             citylimit: true,  //是否强制限制在设置的城市内搜索
//             map: map, // 展现结果的地图实例
//             panel: "panel", // 结果列表将在此容器中进行展示。
//             autoFitView: true // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
//         });
//         //关键字查询
//         placeSearch.search(Keyword);
//     });
// }