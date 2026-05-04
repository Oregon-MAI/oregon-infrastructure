# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [booking/booking.proto](#booking_booking-proto)
    - [AdminCancelBookingRequest](#booking-v1-AdminCancelBookingRequest)
    - [AdminCancelBookingResponse](#booking-v1-AdminCancelBookingResponse)
    - [Booking](#booking-v1-Booking)
    - [CreateBookingRequest](#booking-v1-CreateBookingRequest)
    - [CreateBookingResponse](#booking-v1-CreateBookingResponse)
    - [GetBookingRequest](#booking-v1-GetBookingRequest)
    - [GetBookingResponse](#booking-v1-GetBookingResponse)
    - [ListBookingsByResourceRequest](#booking-v1-ListBookingsByResourceRequest)
    - [ListBookingsByResourceResponse](#booking-v1-ListBookingsByResourceResponse)
    - [ListBookingsByUserRequest](#booking-v1-ListBookingsByUserRequest)
    - [ListBookingsByUserResponse](#booking-v1-ListBookingsByUserResponse)
    - [UserCancelBookingRequest](#booking-v1-UserCancelBookingRequest)
    - [UserCancelBookingResponse](#booking-v1-UserCancelBookingResponse)
  
    - [BookingStatus](#booking-v1-BookingStatus)
  
    - [BookingService](#booking-v1-BookingService)
  
- [Scalar Value Types](#scalar-value-types)



<a name="booking_booking-proto"></a>
<p align="right"><a href="#top">Top</a></p>

## booking/booking.proto



<a name="booking-v1-AdminCancelBookingRequest"></a>

### AdminCancelBookingRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking_id | [string](#string) |  |  |






<a name="booking-v1-AdminCancelBookingResponse"></a>

### AdminCancelBookingResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking | [Booking](#booking-v1-Booking) |  |  |






<a name="booking-v1-Booking"></a>

### Booking



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking_id | [string](#string) |  |  |
| resource_id | [string](#string) |  |  |
| user_id | [string](#string) |  |  |
| resource_name | [string](#string) |  |  |
| resource_location | [string](#string) |  |  |
| resource_type | [string](#string) |  |  |
| starts_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |
| ends_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |
| status | [BookingStatus](#booking-v1-BookingStatus) |  |  |
| cancel_reason | [string](#string) |  |  |
| created_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |
| updated_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |






<a name="booking-v1-CreateBookingRequest"></a>

### CreateBookingRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |
| user_id | [string](#string) |  |  |
| starts_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |
| ends_at | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |






<a name="booking-v1-CreateBookingResponse"></a>

### CreateBookingResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking | [Booking](#booking-v1-Booking) |  |  |






<a name="booking-v1-GetBookingRequest"></a>

### GetBookingRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking_id | [string](#string) |  |  |






<a name="booking-v1-GetBookingResponse"></a>

### GetBookingResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking | [Booking](#booking-v1-Booking) |  |  |






<a name="booking-v1-ListBookingsByResourceRequest"></a>

### ListBookingsByResourceRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| resource_id | [string](#string) |  |  |
| from | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |
| to | [google.protobuf.Timestamp](#google-protobuf-Timestamp) |  |  |






<a name="booking-v1-ListBookingsByResourceResponse"></a>

### ListBookingsByResourceResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| bookings | [Booking](#booking-v1-Booking) | repeated |  |






<a name="booking-v1-ListBookingsByUserRequest"></a>

### ListBookingsByUserRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| user_id | [string](#string) |  |  |






<a name="booking-v1-ListBookingsByUserResponse"></a>

### ListBookingsByUserResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| bookings | [Booking](#booking-v1-Booking) | repeated |  |






<a name="booking-v1-UserCancelBookingRequest"></a>

### UserCancelBookingRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking_id | [string](#string) |  |  |






<a name="booking-v1-UserCancelBookingResponse"></a>

### UserCancelBookingResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| booking | [Booking](#booking-v1-Booking) |  |  |





 


<a name="booking-v1-BookingStatus"></a>

### BookingStatus


| Name | Number | Description |
| ---- | ------ | ----------- |
| BOOKING_STATUS_UNSPECIFIED | 0 |  |
| BOOKING_STATUS_CONFIRMED | 1 |  |
| BOOKING_STATUS_CANCELED | 2 |  |


 

 


<a name="booking-v1-BookingService"></a>

### BookingService


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| CreateBooking | [CreateBookingRequest](#booking-v1-CreateBookingRequest) | [CreateBookingResponse](#booking-v1-CreateBookingResponse) |  |
| GetBooking | [GetBookingRequest](#booking-v1-GetBookingRequest) | [GetBookingResponse](#booking-v1-GetBookingResponse) |  |
| UserCancelBooking | [UserCancelBookingRequest](#booking-v1-UserCancelBookingRequest) | [UserCancelBookingResponse](#booking-v1-UserCancelBookingResponse) |  |
| AdminCancelBooking | [AdminCancelBookingRequest](#booking-v1-AdminCancelBookingRequest) | [AdminCancelBookingResponse](#booking-v1-AdminCancelBookingResponse) |  |
| ListBookingsByUser | [ListBookingsByUserRequest](#booking-v1-ListBookingsByUserRequest) | [ListBookingsByUserResponse](#booking-v1-ListBookingsByUserResponse) |  |
| ListBookingsByResource | [ListBookingsByResourceRequest](#booking-v1-ListBookingsByResourceRequest) | [ListBookingsByResourceResponse](#booking-v1-ListBookingsByResourceResponse) |  |

 



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

