import 'service.utils;

import ballerina/log;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerina/websocket;

// ws connection for incident broadcast
websocket:Caller[] incidentConnections = [];

listener websocket:Listener incidentListener = new (9091);

service /incidents on incidentListener {
    resource function get .() returns websocket:Service|websocket:UpgradeError {
        log:printInfo("ws upgrade request received for /incidents/");
        return new IncidentWebSocketService();
    }
}

service class IncidentWebSocketService {
    *websocket:Service;

    public function init() {
    }

    remote function onOpen(websocket:Caller caller) returns websocket:Error? {
        incidentConnections.push(caller);
        log:printInfo("new ws client connected for /incidents");
        return;
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) returns websocket:Error? {
        removeIncidentConnection(caller);
        log:printInfo("ws client disconnected ");
        return;
    }

    remote function onError(websocket:Caller caller, websocket:Error err) returns websocket:Error? {
        log:printError("ws error: " + err.message());
        removeIncidentConnection(caller);
        return;
    }
}

function removeIncidentConnection(websocket:Caller caller) {
    websocket:Caller[] updatedConnections = [];
    foreach websocket:Caller conn in incidentConnections {
        if conn !== caller {
            updatedConnections.push(conn);
        }
    }
    incidentConnections = updatedConnections;
}

function broadcastIncident(Incident incident) {
    if incidentConnections.length() > 0 {
        string messageJson = string `{"type":"new_incident","data":${incident.toJsonString()}}`;

        websocket:Caller[] activeConnections = [];
        foreach websocket:Caller conn in incidentConnections {
            var result = conn->writeTextMessage(messageJson);
            if result is websocket:Error {
                log:printError("failed to send message to client: " + result.message());
            } else {
                activeConnections.push(conn);
            }
        }
        incidentConnections = activeConnections;
        log:printInfo("broadcast new incident to " + activeConnections.length().toString() + " clients");
    }
}

public function createIncident(IncidentCreateRequest incidentRequest) returns IncidentResponse|error {
    string incidentId = uuid:createType1AsString();
    time:Utc now = time:utcNow();
    string currentTime = time:utcToString(now);

    IncidentInsert incidentInsert = {
        incidentId: incidentId,
        userId: incidentRequest.userId,
        incidentType: incidentRequest.'type,
        description: incidentRequest.description,
        latitude: incidentRequest.latitude,
        longitude: incidentRequest.longitude,
        reportedAt: currentTime,
        createdAt: currentTime,
        updatedAt: currentTime
    };

    sql:ExecutionResult|sql:Error dbResult = insertIncident(incidentInsert);
    if dbResult is sql:Error {
        return {success: false, message: "failed to save incident: " + dbResult.message()};
    }

    IncidentRecord|sql:Error createdIncident = getIncidentByIdFromDb(incidentId);
    if createdIncident is sql:Error {
        return {success: false, message: "failed to retrieve created incident"};
    }

    Incident incident = mapIncidentRecordToIncident(createdIncident);
    broadcastIncident(incident);

    notifyNearbyUsers(
            incidentRequest.latitude,
            incidentRequest.longitude,
            incidentRequest.'type,
            incidentRequest.description
    );

    return {success: true, message: "incident created successfully", data: incident};
}

public isolated function getAllIncidents() returns IncidentListResponse|error {
    IncidentRecord[]|sql:Error dbResult = getAllIncidentsFromDb();
    if dbResult is sql:Error {
        return {success: false, message: "failed to fetch incidents: " + dbResult.message()};
    }

    Incident[] incidents = [];
    foreach IncidentRecord incidentRecord in dbResult {
        Incident incident = mapIncidentRecordToIncident(incidentRecord);
        incidents.push(incident);
    }

    return {success: true, message: "incidents fetched successfully", data: incidents};
}

public isolated function getIncidentById(string incidentId) returns IncidentResponse|error {
    IncidentRecord|sql:Error dbResult = getIncidentByIdFromDb(incidentId);
    if dbResult is sql:Error {
        return {success: false, message: "incident not found"};
    }

    Incident incident = mapIncidentRecordToIncident(dbResult);
    return {success: true, message: "incident fetched successfully", data: incident};
}

isolated function mapIncidentRecordToIncident(IncidentRecord incidentRecord) returns Incident {
    return {
        incidentId: incidentRecord.incident_id,
        userId: incidentRecord.user_id,
        incidentType: incidentRecord.incident_type,
        description: incidentRecord.description,
        latitude: incidentRecord.latitude,
        longitude: incidentRecord.longitude,
        reportedAt: incidentRecord.reported_at,
        createdAt: incidentRecord.created_at,
        updatedAt: incidentRecord.updated_at
    };
}

isolated function insertIncident(IncidentInsert incidentData) returns sql:ExecutionResult|sql:Error {
    sql:ParameterizedQuery insertQuery = `
        INSERT INTO incidents (
            incident_id, user_id, incident_type, description, latitude, longitude,
            reported_at, created_at, updated_at
        ) VALUES (
            ${incidentData.incidentId}, ${incidentData.userId}, ${incidentData.incidentType},
            ${incidentData.description}, ${incidentData.latitude}, ${incidentData.longitude},
            ${incidentData.reportedAt}::timestamp, ${incidentData.createdAt}::timestamp, ${incidentData.updatedAt}::timestamp
        )
    `;
    return utils:dbClient->execute(insertQuery);
}

isolated function getAllIncidentsFromDb() returns IncidentRecord[]|sql:Error {
    sql:ParameterizedQuery selectQuery = `
        SELECT incident_id, user_id, incident_type, description, latitude, longitude,
               reported_at, created_at, updated_at
        FROM incidents 
        ORDER BY created_at DESC
    `;

    stream<IncidentRecord, sql:Error?> incidentStream = utils:dbClient->query(selectQuery, IncidentRecord);
    IncidentRecord[] incidents = check from var incident in incidentStream
        select incident;
    return incidents;
}

isolated function getIncidentByIdFromDb(string incidentId) returns IncidentRecord|sql:Error {
    sql:ParameterizedQuery selectQuery = `
        SELECT incident_id, user_id, incident_type, description, latitude, longitude,
               reported_at, created_at, updated_at
        FROM incidents 
        WHERE incident_id = ${incidentId}
    `;

    return utils:dbClient->queryRow(selectQuery);
}

public type Incident record {
    string incidentId;
    string userId;
    string incidentType;
    string description;
    float latitude;
    float longitude;
    string reportedAt;
    string createdAt;
    string updatedAt;
};

public type IncidentCreateRequest record {
    string userId;
    string 'type;
    string description;
    float latitude;
    float longitude;
};

public type IncidentResponse record {
    boolean success;
    string message;
    Incident? data?;
};

public type IncidentListResponse record {
    boolean success;
    string message;
    Incident[]? data?;
};

public type IncidentRecord record {
    string incident_id;
    string user_id;
    string incident_type;
    string description;
    float latitude;
    float longitude;
    string reported_at;
    string created_at;
    string updated_at;
};

public type IncidentInsert record {
    string incidentId;
    string userId;
    string incidentType;
    string description;
    float latitude;
    float longitude;
    string reportedAt;
    string createdAt;
    string updatedAt;
};
