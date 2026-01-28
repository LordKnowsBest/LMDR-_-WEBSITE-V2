
async function testIowaBridgeAPI() {
    console.log('Testing Iowa Open Data Bridge API...');
    const url = 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Iowa_Bridges_Unofficial/FeatureServer/0/query';
    const query = {
        where: 'MIN_VERT_CLR_FT < 14.5 AND MIN_VERT_CLR_FT > 0',
        outFields: 'MIN_VERT_CLR_FT,FACILITY_CARRIED,FEATURE_INTERSECTED,LATITUDE,LONGITUDE',
        f: 'json',
        resultRecordCount: 5
    };

    const params = new URLSearchParams(query).toString();
    console.log(`Fetching: ${url}?${params}`);

    try {
        const res = await fetch(`${url}?${params}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`Status: ${res.status} ${res.statusText}`);
        const data = await res.json();

        console.log('Success!');
        console.log(`Found ${data.features ? data.features.length : 0} bridges.`);
        if (data.features && data.features.length > 0) {
            console.log('Sample Bridge:', JSON.stringify(data.features[0].attributes, null, 2));
        } else {
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

testIowaBridgeAPI();
