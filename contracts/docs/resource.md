# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [resource/resource.proto](#resource_resource-proto)
    - [ChangeResourceStatusRequest](#resource-v1-ChangeResourceStatusRequest)
    - [ChangeResourceStatusResponse](#resource-v1-ChangeResourceStatusResponse)
    - [CheckResourceStatusRequest](#resource-v1-CheckResourceStatusRequest)
    - [CheckResourceStatusResponse](#resource-v1-CheckResourceStatusResponse)
    - [CreateResourceRequest](#resource-v1-CreateResourceRequest)
    - [CreateResourceResponse](#resource-v1-CreateResourceResponse)
    - [DeleteResourceRequest](#resource-v1-DeleteResourceRequest)
    - [DeleteResourceResponse](#resource-v1-DeleteResourceResponse)
    - [DeviceDetails](#resource-v1-DeviceDetails)
    - [GetAvailableResourcesRequest](#resource-v1-GetAvailableResourcesRequest)
    - [GetAvailableResourcesResponse](#resource-v1-GetAvailableResourcesResponse)
    - [GetResourceRequest](#resource-v1-GetResourceRequest)
    - [GetResourceResponse](#resource-v1-GetResourceResponse)
    - [GetResourcesListRequest](#resource-v1-GetResourcesListRequest)
    - [GetResourcesListResponse](#resource-v1-GetResourcesListResponse)
    - [MeetingRoomDetails](#resource-v1-MeetingRoomDetails)
    - [Resource](#resource-v1-Resource)
    - [UpdateResourceOccupancyRequest](#resource-v1-UpdateResourceOccupancyRequest)
    - [UpdateResourceOccupancyResponse](#resource-v1-UpdateResourceOccupancyResponse)
    - [UpdateResourceRequest](#resource-v1-UpdateResourceRequest)
    - [UpdateResourceResponse](#resource-v1-UpdateResourceResponse)
    - [WorkspaceDetails](#resource-v1-WorkspaceDetails)
  
    - [ResourceStatus](#resource-v1-ResourceStatus)
    - [ResourceType](#resource-v1-ResourceType)
  
    - [ResourceBookingService](#resource-v1-ResourceBookingService)
    - [ResourcePublicService](#resource-v1-ResourcePublicService)
  
- [Scalar Value Types](#scalar-value-types)



<a name="resource_resource-proto"></a>
<p align="right"><a href="#top">Top</a></p>

## resource/resource.proto



<a name="resource-v1-ChangeResourceStatusRequest"></a>

### ChangeResourceStatusRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |
| status | [ResourceStatus](#resource-v1-ResourceStatus) |  |  |
| reason | [string](#string) |  |  |






<a name="resource-v1-ChangeResourceStatusResponse"></a>

### ChangeResourceStatusResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource | [Resource](#resource-v1-Resource) |  |  |






<a name="resource-v1-CheckResourceStatusRequest"></a>

### CheckResourceStatusRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |






<a name="resource-v1-CheckResourceStatusResponse"></a>

### CheckResourceStatusResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| is_available | [bool](#bool) |  |  |
| status | [ResourceStatus](#resource-v1-ResourceStatus) |  |  |






<a name="resource-v1-CreateResourceRequest"></a>

### CreateResourceRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#string) |  |  |
| type | [ResourceType](#resource-v1-ResourceType) |  |  |
| location | [string](#string) |  |  |
| meeting_room | [MeetingRoomDetails](#resource-v1-MeetingRoomDetails) |  |  |
| workspace | [WorkspaceDetails](#resource-v1-WorkspaceDetails) |  |  |
| device | [DeviceDetails](#resource-v1-DeviceDetails) |  |  |






<a name="resource-v1-CreateResourceResponse"></a>

### CreateResourceResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource | [Resource](#resource-v1-Resource) |  |  |






<a name="resource-v1-DeleteResourceRequest"></a>

### DeleteResourceRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |






<a name="resource-v1-DeleteResourceResponse"></a>

### DeleteResourceResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| success | [bool](#bool) |  |  |






<a name="resource-v1-DeviceDetails"></a>

### DeviceDetails



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| device_type | [string](#string) |  |  |
| serial_number | [string](#string) |  |  |
| model | [string](#string) |  |  |
| description | [string](#string) |  |  |






<a name="resource-v1-GetAvailableResourcesRequest"></a>

### GetAvailableResourcesRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| types | [ResourceType](#resource-v1-ResourceType) | repeated |  |
| location | [string](#string) |  |  |






<a name="resource-v1-GetAvailableResourcesResponse"></a>

### GetAvailableResourcesResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resources | [Resource](#resource-v1-Resource) | repeated |  |
| total_count | [int32](#int32) |  |  |






<a name="resource-v1-GetResourceRequest"></a>

### GetResourceRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |






<a name="resource-v1-GetResourceResponse"></a>

### GetResourceResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource | [Resource](#resource-v1-Resource) |  |  |






<a name="resource-v1-GetResourcesListRequest"></a>

### GetResourcesListRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| types | [ResourceType](#resource-v1-ResourceType) | repeated |  |






<a name="resource-v1-GetResourcesListResponse"></a>

### GetResourcesListResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resources | [Resource](#resource-v1-Resource) | repeated |  |






<a name="resource-v1-MeetingRoomDetails"></a>

### MeetingRoomDetails



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| capacity | [int32](#int32) |  |  |
| has_projector | [bool](#bool) |  |  |
| has_whiteboard | [bool](#bool) |  |  |






<a name="resource-v1-Resource"></a>

### Resource



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |
| name | [string](#string) |  |  |
| type | [ResourceType](#resource-v1-ResourceType) |  |  |
| location | [string](#string) |  |  |
| status | [ResourceStatus](#resource-v1-ResourceStatus) |  |  |
| meeting_room | [MeetingRoomDetails](#resource-v1-MeetingRoomDetails) |  |  |
| workspace | [WorkspaceDetails](#resource-v1-WorkspaceDetails) |  |  |
| device | [DeviceDetails](#resource-v1-DeviceDetails) |  |  |
| created_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |
| updated_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |






<a name="resource-v1-UpdateResourceOccupancyRequest"></a>

### UpdateResourceOccupancyRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |
| is_occupied | [bool](#bool) |  |  |






<a name="resource-v1-UpdateResourceOccupancyResponse"></a>

### UpdateResourceOccupancyResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| success | [bool](#bool) |  |  |
| status | [ResourceStatus](#resource-v1-ResourceStatus) |  |  |






<a name="resource-v1-UpdateResourceRequest"></a>

### UpdateResourceRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |
| resource | [Resource](#resource-v1-Resource) |  |  |
| field_mask | [google.protobuf.FieldMask](#google-protobuf-FieldMask) |  |  |






<a name="resource-v1-UpdateResourceResponse"></a>

### UpdateResourceResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource | [Resource](#resource-v1-Resource) |  |  |






<a name="resource-v1-WorkspaceDetails"></a>

### WorkspaceDetails



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| has_monitor | [bool](#bool) |  |  |





 


<a name="resource-v1-ResourceStatus"></a>

### ResourceStatus


| Name | Number | Description |
| ---- | ------ | ----------- |
| RESOURCE_STATUS_UNSPECIFIED | 0 |  |
| RESOURCE_STATUS_AVAILABLE | 1 | доступен |
| RESOURCE_STATUS_OCCUPIED | 2 | занят прямо сейчас |
| RESOURCE_STATUS_MAINTENANCE | 3 | плановое обслуживание |
| RESOURCE_STATUS_EMERGENCY | 4 | форс-мажор |



<a name="resource-v1-ResourceType"></a>

### ResourceType


| Name | Number | Description |
| ---- | ------ | ----------- |
| RESOURCE_TYPE_UNSPECIFIED | 0 |  |
| RESOURCE_TYPE_MEETING_ROOM | 1 | переговорка |
| RESOURCE_TYPE_WORKSPACE | 2 | рабочее место |
| RESOURCE_TYPE_DEVICE | 3 | устройство |


 

 


<a name="resource-v1-ResourceBookingService"></a>

### ResourceBookingService


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| GetResource | [GetResourceRequest](#resource-v1-GetResourceRequest) | [GetResourceResponse](#resource-v1-GetResourceResponse) |  |
| CheckResourceStatus | [CheckResourceStatusRequest](#resource-v1-CheckResourceStatusRequest) | [CheckResourceStatusResponse](#resource-v1-CheckResourceStatusResponse) |  |
| GetAvailableResources | [GetAvailableResourcesRequest](#resource-v1-GetAvailableResourcesRequest) | [GetAvailableResourcesResponse](#resource-v1-GetAvailableResourcesResponse) |  |
| UpdateResourceOccupancy | [UpdateResourceOccupancyRequest](#resource-v1-UpdateResourceOccupancyRequest) | [UpdateResourceOccupancyResponse](#resource-v1-UpdateResourceOccupancyResponse) |  |


<a name="resource-v1-ResourcePublicService"></a>

### ResourcePublicService


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| CreateResource | [CreateResourceRequest](#resource-v1-CreateResourceRequest) | [CreateResourceResponse](#resource-v1-CreateResourceResponse) |  |
| GetResource | [GetResourceRequest](#resource-v1-GetResourceRequest) | [GetResourceResponse](#resource-v1-GetResourceResponse) |  |
| GetResourcesList | [GetResourcesListRequest](#resource-v1-GetResourcesListRequest) | [GetResourcesListResponse](#resource-v1-GetResourcesListResponse) |  |
| UpdateResource | [UpdateResourceRequest](#resource-v1-UpdateResourceRequest) | [UpdateResourceResponse](#resource-v1-UpdateResourceResponse) |  |
| DeleteResource | [DeleteResourceRequest](#resource-v1-DeleteResourceRequest) | [DeleteResourceResponse](#resource-v1-DeleteResourceResponse) |  |
| ChangeResourceStatus | [ChangeResourceStatusRequest](#resource-v1-ChangeResourceStatusRequest) | [ChangeResourceStatusResponse](#resource-v1-ChangeResourceStatusResponse) |  |
| GetAvailableResources | [GetAvailableResourcesRequest](#resource-v1-GetAvailableResourcesRequest) | [GetAvailableResourcesResponse](#resource-v1-GetAvailableResourcesResponse) |  |

 



## Scalar Value Types

| .proto Type | Notes | C++ | Java | Python | Go | C# | PHP | Ruby |
| ----------- | ----- | --- | ---- | ------ | -- | -- | --- | ---- |
| <a name="double" /> double |  | double | double | float | float64 | double | float | Float |
| <a name="float" /> float |  | float | float | float | float32 | float | float | Float |
| <a name="int32" /> int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="int64" /> int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="uint32" /> uint32 | Uses variable-length encoding. | uint32 | int | int/long | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="uint64" /> uint64 | Uses variable-length encoding. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum or Fixnum (as required) |
| <a name="sint32" /> sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sint64" /> sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="fixed32" /> fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | uint32 | int | int | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="fixed64" /> fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum |
| <a name="sfixed32" /> sfixed32 | Always four bytes. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sfixed64" /> sfixed64 | Always eight bytes. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="bool" /> bool |  | bool | boolean | boolean | bool | bool | boolean | TrueClass/FalseClass |
| <a name="string" /> string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | string | String | str/unicode | string | string | string | String (UTF-8) |
| <a name="bytes" /> bytes | May contain any arbitrary sequence of bytes. | string | ByteString | str | []byte | ByteString | string | String (ASCII-8BIT) |

