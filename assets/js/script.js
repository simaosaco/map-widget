const svg = d3.select("svg#map");
const infoBox = d3.select("#info-box");

const regionData = {
  "South East": {
    modHigh: "68,384",
    developable: "41,031",
    homes40: "1,641,226",
    homes60: "2,461,839"
  },
  "Yorkshire and The Humber": {
    modHigh: "47,549",
    developable: "28,529",
    homes40: "1,141,178",
    homes60: "1,711,767"
  },
  "West Midlands": {
    modHigh: "49,050",
    developable: "29,430",
    homes40: "1,177,211",
    homes60: "1,765,816"
  },
  "North West": {
    modHigh: "37,774",
    developable: "22,664",
    homes40: "906,577",
    homes60: "1,359,866"
  },
  "Eastern": {
    modHigh: "55,245",
    developable: "33,147",
    homes40: "1,325,884",
    homes60: "1,988,826"
  },
  "South West": {
    modHigh: "9,780",
    developable: "5,868",
    homes40: "234,722",
    homes60: "352,083"
  },
  "North East": {
    modHigh: "10,782",
    developable: "6,469",
    homes40: "258,762",
    homes60: "388,142"
  },
  "East Midlands": {
    modHigh: "7,976",
    developable: "4,786",
    homes40: "191,431",
    homes60: "287,147"
  },
  "London": {
    modHigh: "14,511",
    developable: "8,706",
    homes40: "348,259",
    homes60: "522,388"
  },
  "Total": {
    modHigh: "301,052",
    developable: "180,631",
    homes40: "7,225,250",
    homes60: "10,837,874"
  }
};

let lastSelectedRegion = null;
const g = svg.append("g");

// Initial dimensions
let width = parseInt(svg.style("width"));
let height = parseInt(svg.style("height"));
svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

// Projection & path
let projection = d3.geoMercator()
  .center([-1.5, 52.5])
  .scale(4000)
  .translate([width / 2, height / 2]);

let path = d3.geoPath().projection(projection);

// Load map
d3.json("https://simaosaco.github.io/map-widget/assets/json/topo_eer.json").then(data => {
  const regions = topojson.feature(data, data.objects.eer);

  const paths = g.selectAll("path")
    .data(regions.features)
    .enter()
    .append("path")
    .attr("class", "region")
    .attr("d", path)
    .on("click", function(event, d) {
      const name = d.properties.EER13NM;

      d3.selectAll(".region").classed("active", false);
      d3.select(this).classed("active", true);

      if (lastSelectedRegion && lastSelectedRegion !== name) {
        const prevId = `label-${lastSelectedRegion.replace(/\s+/g, '-')}`;
        d3.select(`#${prevId}`).style("display", "block");
      }

      const labelId = `label-${name.replace(/\s+/g, '-')}`;
      d3.select(`#${labelId}`).style("display", "none");

      lastSelectedRegion = name;

      const info = regionData[name];
      infoBox.html(info ? `
          <div class="info-title">${name}</div>
          <div class="info-list">
            <div class="info-list-item"><span>Mod and High (ha)</span><span>${info.modHigh}</span></div>
            <div class="info-list-item"><span>0% assumed Developable Area (ha)</span><span>${info.developable}</span></div>
            <div class="info-list-item"><span>Homes at 40 dph</span><span>${info.homes40}</span></div>
            <div class="info-list-item"><span>Homes at 60 dph</span><span>${info.homes60}</span></div>
          </div>` : `<strong>${name}</strong><p>No data available.</p>`);

      event.stopPropagation();
    });

  g.selectAll("foreignObject")
    .data(regions.features)
    .enter()
    .append("foreignObject")
    .attr("class", "region-label")
    .attr("id", d => `label-${d.properties.EER13NM.replace(/\s+/g, '-')}`)
    .attr("x", d => path.centroid(d)[0] - 50)
    .attr("y", d => path.centroid(d)[1] - 10)
    .attr("width", 80)
    .attr("height", 30)
    .append("xhtml:div")
    .html(d => d.properties.EER13NM);

  // Calculate bounds and responsive zoom extent
  const bounds = path.bounds(regions);
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const x = (bounds[0][0] + bounds[1][0]) / 2;
  const y = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
  const translate = [width / 2 - scale * x, height / 2 - scale * y];

  // Improved zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([
      [bounds[0][0] - width, bounds[0][1] - height],
      [bounds[1][0] + width, bounds[1][1] + height]
    ])
    .on("zoom", event => g.attr("transform", event.transform));

  if (window.innerWidth > 767) {
    svg.call(zoom).call(
      zoom.transform,
      d3.zoomIdentity.translate(...translate).scale(scale)
    );
  } else {
    g.attr("transform", d3.zoomIdentity);
  }

  svg.on("click", () => {
    d3.selectAll(".region").classed("active", false);
    if (lastSelectedRegion) {
      const labelId = `label-${lastSelectedRegion.replace(/\s+/g, '-')}`;
      d3.select(`#${labelId}`).style("display", "block");
    }
    lastSelectedRegion = null;

    const defaultInfo = regionData["Total"];
    infoBox.html(`
      <div class="info-title">England</div>
      <div class="info-list">
        <div class="info-list-item"><span>Mod and High (ha)</span><span>${defaultInfo.modHigh}</span></div>
        <div class="info-list-item"><span>0% assumed Developable Area (ha)</span><span>${defaultInfo.developable}</span></div>
        <div class="info-list-item"><span>Homes at 40 dph</span><span>${defaultInfo.homes40}</span></div>
        <div class="info-list-item"><span>Homes at 60 dph</span><span>${defaultInfo.homes60}</span></div>
      </div>
    `);
  });

  // Default info load
  const defaultInfo = regionData["Total"];
  infoBox.html(`
    <div class="info-title">England</div>
    <div class="info-list">
      <div class="info-list-item"><span>Mod and High (ha)</span><span>${defaultInfo.modHigh}</span></div>
      <div class="info-list-item"><span>0% assumed Developable Area (ha)</span><span>${defaultInfo.developable}</span></div>
      <div class="info-list-item"><span>Homes at 40 dph</span><span>${defaultInfo.homes40}</span></div>
      <div class="info-list-item"><span>Homes at 60 dph</span><span>${defaultInfo.homes60}</span></div>
    </div>
  `);
});
