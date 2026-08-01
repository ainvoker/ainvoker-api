import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model AIRequest
 *
 */
export type AIRequestModel = runtime.Types.Result.DefaultSelection<Prisma.$AIRequestPayload>;
export type AggregateAIRequest = {
    _count: AIRequestCountAggregateOutputType | null;
    _avg: AIRequestAvgAggregateOutputType | null;
    _sum: AIRequestSumAggregateOutputType | null;
    _min: AIRequestMinAggregateOutputType | null;
    _max: AIRequestMaxAggregateOutputType | null;
};
export type AIRequestAvgAggregateOutputType = {
    modelId: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    latency: number | null;
    requestCost: runtime.Decimal | null;
};
export type AIRequestSumAggregateOutputType = {
    modelId: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    latency: number | null;
    requestCost: runtime.Decimal | null;
};
export type AIRequestMinAggregateOutputType = {
    id: string | null;
    projectId: string | null;
    apiKeyId: string | null;
    modelId: number | null;
    serviceType: $Enums.AIServiceType | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    latency: number | null;
    requestCost: runtime.Decimal | null;
    requestStatus: $Enums.AIRequestStatus | null;
    createdAt: Date | null;
};
export type AIRequestMaxAggregateOutputType = {
    id: string | null;
    projectId: string | null;
    apiKeyId: string | null;
    modelId: number | null;
    serviceType: $Enums.AIServiceType | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    latency: number | null;
    requestCost: runtime.Decimal | null;
    requestStatus: $Enums.AIRequestStatus | null;
    createdAt: Date | null;
};
export type AIRequestCountAggregateOutputType = {
    id: number;
    projectId: number;
    apiKeyId: number;
    modelId: number;
    serviceType: number;
    requestPayload: number;
    responsePayload: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latency: number;
    requestCost: number;
    requestStatus: number;
    createdAt: number;
    _all: number;
};
export type AIRequestAvgAggregateInputType = {
    modelId?: true;
    inputTokens?: true;
    outputTokens?: true;
    totalTokens?: true;
    latency?: true;
    requestCost?: true;
};
export type AIRequestSumAggregateInputType = {
    modelId?: true;
    inputTokens?: true;
    outputTokens?: true;
    totalTokens?: true;
    latency?: true;
    requestCost?: true;
};
export type AIRequestMinAggregateInputType = {
    id?: true;
    projectId?: true;
    apiKeyId?: true;
    modelId?: true;
    serviceType?: true;
    inputTokens?: true;
    outputTokens?: true;
    totalTokens?: true;
    latency?: true;
    requestCost?: true;
    requestStatus?: true;
    createdAt?: true;
};
export type AIRequestMaxAggregateInputType = {
    id?: true;
    projectId?: true;
    apiKeyId?: true;
    modelId?: true;
    serviceType?: true;
    inputTokens?: true;
    outputTokens?: true;
    totalTokens?: true;
    latency?: true;
    requestCost?: true;
    requestStatus?: true;
    createdAt?: true;
};
export type AIRequestCountAggregateInputType = {
    id?: true;
    projectId?: true;
    apiKeyId?: true;
    modelId?: true;
    serviceType?: true;
    requestPayload?: true;
    responsePayload?: true;
    inputTokens?: true;
    outputTokens?: true;
    totalTokens?: true;
    latency?: true;
    requestCost?: true;
    requestStatus?: true;
    createdAt?: true;
    _all?: true;
};
export type AIRequestAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which AIRequest to aggregate.
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AIRequests to fetch.
     */
    orderBy?: Prisma.AIRequestOrderByWithRelationInput | Prisma.AIRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.AIRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AIRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AIRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned AIRequests
    **/
    _count?: true | AIRequestCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: AIRequestAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: AIRequestSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: AIRequestMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: AIRequestMaxAggregateInputType;
};
export type GetAIRequestAggregateType<T extends AIRequestAggregateArgs> = {
    [P in keyof T & keyof AggregateAIRequest]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAIRequest[P]> : Prisma.GetScalarType<T[P], AggregateAIRequest[P]>;
};
export type AIRequestGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AIRequestWhereInput;
    orderBy?: Prisma.AIRequestOrderByWithAggregationInput | Prisma.AIRequestOrderByWithAggregationInput[];
    by: Prisma.AIRequestScalarFieldEnum[] | Prisma.AIRequestScalarFieldEnum;
    having?: Prisma.AIRequestScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AIRequestCountAggregateInputType | true;
    _avg?: AIRequestAvgAggregateInputType;
    _sum?: AIRequestSumAggregateInputType;
    _min?: AIRequestMinAggregateInputType;
    _max?: AIRequestMaxAggregateInputType;
};
export type AIRequestGroupByOutputType = {
    id: string;
    projectId: string;
    apiKeyId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: runtime.JsonValue;
    responsePayload: runtime.JsonValue | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    latency: number | null;
    requestCost: runtime.Decimal | null;
    requestStatus: $Enums.AIRequestStatus;
    createdAt: Date;
    _count: AIRequestCountAggregateOutputType | null;
    _avg: AIRequestAvgAggregateOutputType | null;
    _sum: AIRequestSumAggregateOutputType | null;
    _min: AIRequestMinAggregateOutputType | null;
    _max: AIRequestMaxAggregateOutputType | null;
};
export type GetAIRequestGroupByPayload<T extends AIRequestGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AIRequestGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AIRequestGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AIRequestGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AIRequestGroupByOutputType[P]>;
}>>;
export type AIRequestWhereInput = {
    AND?: Prisma.AIRequestWhereInput | Prisma.AIRequestWhereInput[];
    OR?: Prisma.AIRequestWhereInput[];
    NOT?: Prisma.AIRequestWhereInput | Prisma.AIRequestWhereInput[];
    id?: Prisma.StringFilter<"AIRequest"> | string;
    projectId?: Prisma.StringFilter<"AIRequest"> | string;
    apiKeyId?: Prisma.StringFilter<"AIRequest"> | string;
    modelId?: Prisma.IntFilter<"AIRequest"> | number;
    serviceType?: Prisma.EnumAIServiceTypeFilter<"AIRequest"> | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonFilter<"AIRequest">;
    responsePayload?: Prisma.JsonNullableFilter<"AIRequest">;
    inputTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    outputTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    totalTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    latency?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    requestCost?: Prisma.DecimalNullableFilter<"AIRequest"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFilter<"AIRequest"> | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFilter<"AIRequest"> | Date | string;
    project?: Prisma.XOR<Prisma.ProjectScalarRelationFilter, Prisma.ProjectWhereInput>;
    apiKey?: Prisma.XOR<Prisma.ApiKeyScalarRelationFilter, Prisma.ApiKeyWhereInput>;
    model?: Prisma.XOR<Prisma.AIModelScalarRelationFilter, Prisma.AIModelWhereInput>;
    actionInvocations?: Prisma.ActionInvocationListRelationFilter;
};
export type AIRequestOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    apiKeyId?: Prisma.SortOrder;
    modelId?: Prisma.SortOrder;
    serviceType?: Prisma.SortOrder;
    requestPayload?: Prisma.SortOrder;
    responsePayload?: Prisma.SortOrderInput | Prisma.SortOrder;
    inputTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    outputTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    totalTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    latency?: Prisma.SortOrderInput | Prisma.SortOrder;
    requestCost?: Prisma.SortOrderInput | Prisma.SortOrder;
    requestStatus?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    project?: Prisma.ProjectOrderByWithRelationInput;
    apiKey?: Prisma.ApiKeyOrderByWithRelationInput;
    model?: Prisma.AIModelOrderByWithRelationInput;
    actionInvocations?: Prisma.ActionInvocationOrderByRelationAggregateInput;
};
export type AIRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.AIRequestWhereInput | Prisma.AIRequestWhereInput[];
    OR?: Prisma.AIRequestWhereInput[];
    NOT?: Prisma.AIRequestWhereInput | Prisma.AIRequestWhereInput[];
    projectId?: Prisma.StringFilter<"AIRequest"> | string;
    apiKeyId?: Prisma.StringFilter<"AIRequest"> | string;
    modelId?: Prisma.IntFilter<"AIRequest"> | number;
    serviceType?: Prisma.EnumAIServiceTypeFilter<"AIRequest"> | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonFilter<"AIRequest">;
    responsePayload?: Prisma.JsonNullableFilter<"AIRequest">;
    inputTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    outputTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    totalTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    latency?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    requestCost?: Prisma.DecimalNullableFilter<"AIRequest"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFilter<"AIRequest"> | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFilter<"AIRequest"> | Date | string;
    project?: Prisma.XOR<Prisma.ProjectScalarRelationFilter, Prisma.ProjectWhereInput>;
    apiKey?: Prisma.XOR<Prisma.ApiKeyScalarRelationFilter, Prisma.ApiKeyWhereInput>;
    model?: Prisma.XOR<Prisma.AIModelScalarRelationFilter, Prisma.AIModelWhereInput>;
    actionInvocations?: Prisma.ActionInvocationListRelationFilter;
}, "id">;
export type AIRequestOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    apiKeyId?: Prisma.SortOrder;
    modelId?: Prisma.SortOrder;
    serviceType?: Prisma.SortOrder;
    requestPayload?: Prisma.SortOrder;
    responsePayload?: Prisma.SortOrderInput | Prisma.SortOrder;
    inputTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    outputTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    totalTokens?: Prisma.SortOrderInput | Prisma.SortOrder;
    latency?: Prisma.SortOrderInput | Prisma.SortOrder;
    requestCost?: Prisma.SortOrderInput | Prisma.SortOrder;
    requestStatus?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.AIRequestCountOrderByAggregateInput;
    _avg?: Prisma.AIRequestAvgOrderByAggregateInput;
    _max?: Prisma.AIRequestMaxOrderByAggregateInput;
    _min?: Prisma.AIRequestMinOrderByAggregateInput;
    _sum?: Prisma.AIRequestSumOrderByAggregateInput;
};
export type AIRequestScalarWhereWithAggregatesInput = {
    AND?: Prisma.AIRequestScalarWhereWithAggregatesInput | Prisma.AIRequestScalarWhereWithAggregatesInput[];
    OR?: Prisma.AIRequestScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AIRequestScalarWhereWithAggregatesInput | Prisma.AIRequestScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"AIRequest"> | string;
    projectId?: Prisma.StringWithAggregatesFilter<"AIRequest"> | string;
    apiKeyId?: Prisma.StringWithAggregatesFilter<"AIRequest"> | string;
    modelId?: Prisma.IntWithAggregatesFilter<"AIRequest"> | number;
    serviceType?: Prisma.EnumAIServiceTypeWithAggregatesFilter<"AIRequest"> | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonWithAggregatesFilter<"AIRequest">;
    responsePayload?: Prisma.JsonNullableWithAggregatesFilter<"AIRequest">;
    inputTokens?: Prisma.IntNullableWithAggregatesFilter<"AIRequest"> | number | null;
    outputTokens?: Prisma.IntNullableWithAggregatesFilter<"AIRequest"> | number | null;
    totalTokens?: Prisma.IntNullableWithAggregatesFilter<"AIRequest"> | number | null;
    latency?: Prisma.IntNullableWithAggregatesFilter<"AIRequest"> | number | null;
    requestCost?: Prisma.DecimalNullableWithAggregatesFilter<"AIRequest"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusWithAggregatesFilter<"AIRequest"> | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"AIRequest"> | Date | string;
};
export type AIRequestCreateInput = {
    id?: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    project: Prisma.ProjectCreateNestedOneWithoutAiRequestsInput;
    apiKey: Prisma.ApiKeyCreateNestedOneWithoutRequestsInput;
    model: Prisma.AIModelCreateNestedOneWithoutRequestsInput;
    actionInvocations?: Prisma.ActionInvocationCreateNestedManyWithoutRequestInput;
};
export type AIRequestUncheckedCreateInput = {
    id?: string;
    projectId: string;
    apiKeyId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedCreateNestedManyWithoutRequestInput;
};
export type AIRequestUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    project?: Prisma.ProjectUpdateOneRequiredWithoutAiRequestsNestedInput;
    apiKey?: Prisma.ApiKeyUpdateOneRequiredWithoutRequestsNestedInput;
    model?: Prisma.AIModelUpdateOneRequiredWithoutRequestsNestedInput;
    actionInvocations?: Prisma.ActionInvocationUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedUpdateManyWithoutRequestNestedInput;
};
export type AIRequestCreateManyInput = {
    id?: string;
    projectId: string;
    apiKeyId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
};
export type AIRequestUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIRequestUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIRequestListRelationFilter = {
    every?: Prisma.AIRequestWhereInput;
    some?: Prisma.AIRequestWhereInput;
    none?: Prisma.AIRequestWhereInput;
};
export type AIRequestOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AIRequestCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    apiKeyId?: Prisma.SortOrder;
    modelId?: Prisma.SortOrder;
    serviceType?: Prisma.SortOrder;
    requestPayload?: Prisma.SortOrder;
    responsePayload?: Prisma.SortOrder;
    inputTokens?: Prisma.SortOrder;
    outputTokens?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    latency?: Prisma.SortOrder;
    requestCost?: Prisma.SortOrder;
    requestStatus?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AIRequestAvgOrderByAggregateInput = {
    modelId?: Prisma.SortOrder;
    inputTokens?: Prisma.SortOrder;
    outputTokens?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    latency?: Prisma.SortOrder;
    requestCost?: Prisma.SortOrder;
};
export type AIRequestMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    apiKeyId?: Prisma.SortOrder;
    modelId?: Prisma.SortOrder;
    serviceType?: Prisma.SortOrder;
    inputTokens?: Prisma.SortOrder;
    outputTokens?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    latency?: Prisma.SortOrder;
    requestCost?: Prisma.SortOrder;
    requestStatus?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AIRequestMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    apiKeyId?: Prisma.SortOrder;
    modelId?: Prisma.SortOrder;
    serviceType?: Prisma.SortOrder;
    inputTokens?: Prisma.SortOrder;
    outputTokens?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    latency?: Prisma.SortOrder;
    requestCost?: Prisma.SortOrder;
    requestStatus?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AIRequestSumOrderByAggregateInput = {
    modelId?: Prisma.SortOrder;
    inputTokens?: Prisma.SortOrder;
    outputTokens?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    latency?: Prisma.SortOrder;
    requestCost?: Prisma.SortOrder;
};
export type AIRequestScalarRelationFilter = {
    is?: Prisma.AIRequestWhereInput;
    isNot?: Prisma.AIRequestWhereInput;
};
export type AIRequestCreateNestedManyWithoutProjectInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutProjectInput, Prisma.AIRequestUncheckedCreateWithoutProjectInput> | Prisma.AIRequestCreateWithoutProjectInput[] | Prisma.AIRequestUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutProjectInput | Prisma.AIRequestCreateOrConnectWithoutProjectInput[];
    createMany?: Prisma.AIRequestCreateManyProjectInputEnvelope;
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
};
export type AIRequestUncheckedCreateNestedManyWithoutProjectInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutProjectInput, Prisma.AIRequestUncheckedCreateWithoutProjectInput> | Prisma.AIRequestCreateWithoutProjectInput[] | Prisma.AIRequestUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutProjectInput | Prisma.AIRequestCreateOrConnectWithoutProjectInput[];
    createMany?: Prisma.AIRequestCreateManyProjectInputEnvelope;
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
};
export type AIRequestUpdateManyWithoutProjectNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutProjectInput, Prisma.AIRequestUncheckedCreateWithoutProjectInput> | Prisma.AIRequestCreateWithoutProjectInput[] | Prisma.AIRequestUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutProjectInput | Prisma.AIRequestCreateOrConnectWithoutProjectInput[];
    upsert?: Prisma.AIRequestUpsertWithWhereUniqueWithoutProjectInput | Prisma.AIRequestUpsertWithWhereUniqueWithoutProjectInput[];
    createMany?: Prisma.AIRequestCreateManyProjectInputEnvelope;
    set?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    disconnect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    delete?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    update?: Prisma.AIRequestUpdateWithWhereUniqueWithoutProjectInput | Prisma.AIRequestUpdateWithWhereUniqueWithoutProjectInput[];
    updateMany?: Prisma.AIRequestUpdateManyWithWhereWithoutProjectInput | Prisma.AIRequestUpdateManyWithWhereWithoutProjectInput[];
    deleteMany?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
};
export type AIRequestUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutProjectInput, Prisma.AIRequestUncheckedCreateWithoutProjectInput> | Prisma.AIRequestCreateWithoutProjectInput[] | Prisma.AIRequestUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutProjectInput | Prisma.AIRequestCreateOrConnectWithoutProjectInput[];
    upsert?: Prisma.AIRequestUpsertWithWhereUniqueWithoutProjectInput | Prisma.AIRequestUpsertWithWhereUniqueWithoutProjectInput[];
    createMany?: Prisma.AIRequestCreateManyProjectInputEnvelope;
    set?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    disconnect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    delete?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    update?: Prisma.AIRequestUpdateWithWhereUniqueWithoutProjectInput | Prisma.AIRequestUpdateWithWhereUniqueWithoutProjectInput[];
    updateMany?: Prisma.AIRequestUpdateManyWithWhereWithoutProjectInput | Prisma.AIRequestUpdateManyWithWhereWithoutProjectInput[];
    deleteMany?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
};
export type AIRequestCreateNestedManyWithoutApiKeyInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutApiKeyInput, Prisma.AIRequestUncheckedCreateWithoutApiKeyInput> | Prisma.AIRequestCreateWithoutApiKeyInput[] | Prisma.AIRequestUncheckedCreateWithoutApiKeyInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutApiKeyInput | Prisma.AIRequestCreateOrConnectWithoutApiKeyInput[];
    createMany?: Prisma.AIRequestCreateManyApiKeyInputEnvelope;
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
};
export type AIRequestUncheckedCreateNestedManyWithoutApiKeyInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutApiKeyInput, Prisma.AIRequestUncheckedCreateWithoutApiKeyInput> | Prisma.AIRequestCreateWithoutApiKeyInput[] | Prisma.AIRequestUncheckedCreateWithoutApiKeyInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutApiKeyInput | Prisma.AIRequestCreateOrConnectWithoutApiKeyInput[];
    createMany?: Prisma.AIRequestCreateManyApiKeyInputEnvelope;
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
};
export type AIRequestUpdateManyWithoutApiKeyNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutApiKeyInput, Prisma.AIRequestUncheckedCreateWithoutApiKeyInput> | Prisma.AIRequestCreateWithoutApiKeyInput[] | Prisma.AIRequestUncheckedCreateWithoutApiKeyInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutApiKeyInput | Prisma.AIRequestCreateOrConnectWithoutApiKeyInput[];
    upsert?: Prisma.AIRequestUpsertWithWhereUniqueWithoutApiKeyInput | Prisma.AIRequestUpsertWithWhereUniqueWithoutApiKeyInput[];
    createMany?: Prisma.AIRequestCreateManyApiKeyInputEnvelope;
    set?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    disconnect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    delete?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    update?: Prisma.AIRequestUpdateWithWhereUniqueWithoutApiKeyInput | Prisma.AIRequestUpdateWithWhereUniqueWithoutApiKeyInput[];
    updateMany?: Prisma.AIRequestUpdateManyWithWhereWithoutApiKeyInput | Prisma.AIRequestUpdateManyWithWhereWithoutApiKeyInput[];
    deleteMany?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
};
export type AIRequestUncheckedUpdateManyWithoutApiKeyNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutApiKeyInput, Prisma.AIRequestUncheckedCreateWithoutApiKeyInput> | Prisma.AIRequestCreateWithoutApiKeyInput[] | Prisma.AIRequestUncheckedCreateWithoutApiKeyInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutApiKeyInput | Prisma.AIRequestCreateOrConnectWithoutApiKeyInput[];
    upsert?: Prisma.AIRequestUpsertWithWhereUniqueWithoutApiKeyInput | Prisma.AIRequestUpsertWithWhereUniqueWithoutApiKeyInput[];
    createMany?: Prisma.AIRequestCreateManyApiKeyInputEnvelope;
    set?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    disconnect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    delete?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    update?: Prisma.AIRequestUpdateWithWhereUniqueWithoutApiKeyInput | Prisma.AIRequestUpdateWithWhereUniqueWithoutApiKeyInput[];
    updateMany?: Prisma.AIRequestUpdateManyWithWhereWithoutApiKeyInput | Prisma.AIRequestUpdateManyWithWhereWithoutApiKeyInput[];
    deleteMany?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
};
export type AIRequestCreateNestedManyWithoutModelInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutModelInput, Prisma.AIRequestUncheckedCreateWithoutModelInput> | Prisma.AIRequestCreateWithoutModelInput[] | Prisma.AIRequestUncheckedCreateWithoutModelInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutModelInput | Prisma.AIRequestCreateOrConnectWithoutModelInput[];
    createMany?: Prisma.AIRequestCreateManyModelInputEnvelope;
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
};
export type AIRequestUncheckedCreateNestedManyWithoutModelInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutModelInput, Prisma.AIRequestUncheckedCreateWithoutModelInput> | Prisma.AIRequestCreateWithoutModelInput[] | Prisma.AIRequestUncheckedCreateWithoutModelInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutModelInput | Prisma.AIRequestCreateOrConnectWithoutModelInput[];
    createMany?: Prisma.AIRequestCreateManyModelInputEnvelope;
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
};
export type AIRequestUpdateManyWithoutModelNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutModelInput, Prisma.AIRequestUncheckedCreateWithoutModelInput> | Prisma.AIRequestCreateWithoutModelInput[] | Prisma.AIRequestUncheckedCreateWithoutModelInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutModelInput | Prisma.AIRequestCreateOrConnectWithoutModelInput[];
    upsert?: Prisma.AIRequestUpsertWithWhereUniqueWithoutModelInput | Prisma.AIRequestUpsertWithWhereUniqueWithoutModelInput[];
    createMany?: Prisma.AIRequestCreateManyModelInputEnvelope;
    set?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    disconnect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    delete?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    update?: Prisma.AIRequestUpdateWithWhereUniqueWithoutModelInput | Prisma.AIRequestUpdateWithWhereUniqueWithoutModelInput[];
    updateMany?: Prisma.AIRequestUpdateManyWithWhereWithoutModelInput | Prisma.AIRequestUpdateManyWithWhereWithoutModelInput[];
    deleteMany?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
};
export type AIRequestUncheckedUpdateManyWithoutModelNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutModelInput, Prisma.AIRequestUncheckedCreateWithoutModelInput> | Prisma.AIRequestCreateWithoutModelInput[] | Prisma.AIRequestUncheckedCreateWithoutModelInput[];
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutModelInput | Prisma.AIRequestCreateOrConnectWithoutModelInput[];
    upsert?: Prisma.AIRequestUpsertWithWhereUniqueWithoutModelInput | Prisma.AIRequestUpsertWithWhereUniqueWithoutModelInput[];
    createMany?: Prisma.AIRequestCreateManyModelInputEnvelope;
    set?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    disconnect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    delete?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    connect?: Prisma.AIRequestWhereUniqueInput | Prisma.AIRequestWhereUniqueInput[];
    update?: Prisma.AIRequestUpdateWithWhereUniqueWithoutModelInput | Prisma.AIRequestUpdateWithWhereUniqueWithoutModelInput[];
    updateMany?: Prisma.AIRequestUpdateManyWithWhereWithoutModelInput | Prisma.AIRequestUpdateManyWithWhereWithoutModelInput[];
    deleteMany?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
};
export type EnumAIServiceTypeFieldUpdateOperationsInput = {
    set?: $Enums.AIServiceType;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableDecimalFieldUpdateOperationsInput = {
    set?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    increment?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    decrement?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    multiply?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    divide?: runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type EnumAIRequestStatusFieldUpdateOperationsInput = {
    set?: $Enums.AIRequestStatus;
};
export type AIRequestCreateNestedOneWithoutActionInvocationsInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutActionInvocationsInput, Prisma.AIRequestUncheckedCreateWithoutActionInvocationsInput>;
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutActionInvocationsInput;
    connect?: Prisma.AIRequestWhereUniqueInput;
};
export type AIRequestUpdateOneRequiredWithoutActionInvocationsNestedInput = {
    create?: Prisma.XOR<Prisma.AIRequestCreateWithoutActionInvocationsInput, Prisma.AIRequestUncheckedCreateWithoutActionInvocationsInput>;
    connectOrCreate?: Prisma.AIRequestCreateOrConnectWithoutActionInvocationsInput;
    upsert?: Prisma.AIRequestUpsertWithoutActionInvocationsInput;
    connect?: Prisma.AIRequestWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.AIRequestUpdateToOneWithWhereWithoutActionInvocationsInput, Prisma.AIRequestUpdateWithoutActionInvocationsInput>, Prisma.AIRequestUncheckedUpdateWithoutActionInvocationsInput>;
};
export type AIRequestCreateWithoutProjectInput = {
    id?: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    apiKey: Prisma.ApiKeyCreateNestedOneWithoutRequestsInput;
    model: Prisma.AIModelCreateNestedOneWithoutRequestsInput;
    actionInvocations?: Prisma.ActionInvocationCreateNestedManyWithoutRequestInput;
};
export type AIRequestUncheckedCreateWithoutProjectInput = {
    id?: string;
    apiKeyId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedCreateNestedManyWithoutRequestInput;
};
export type AIRequestCreateOrConnectWithoutProjectInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutProjectInput, Prisma.AIRequestUncheckedCreateWithoutProjectInput>;
};
export type AIRequestCreateManyProjectInputEnvelope = {
    data: Prisma.AIRequestCreateManyProjectInput | Prisma.AIRequestCreateManyProjectInput[];
    skipDuplicates?: boolean;
};
export type AIRequestUpsertWithWhereUniqueWithoutProjectInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    update: Prisma.XOR<Prisma.AIRequestUpdateWithoutProjectInput, Prisma.AIRequestUncheckedUpdateWithoutProjectInput>;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutProjectInput, Prisma.AIRequestUncheckedCreateWithoutProjectInput>;
};
export type AIRequestUpdateWithWhereUniqueWithoutProjectInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateWithoutProjectInput, Prisma.AIRequestUncheckedUpdateWithoutProjectInput>;
};
export type AIRequestUpdateManyWithWhereWithoutProjectInput = {
    where: Prisma.AIRequestScalarWhereInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateManyMutationInput, Prisma.AIRequestUncheckedUpdateManyWithoutProjectInput>;
};
export type AIRequestScalarWhereInput = {
    AND?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
    OR?: Prisma.AIRequestScalarWhereInput[];
    NOT?: Prisma.AIRequestScalarWhereInput | Prisma.AIRequestScalarWhereInput[];
    id?: Prisma.StringFilter<"AIRequest"> | string;
    projectId?: Prisma.StringFilter<"AIRequest"> | string;
    apiKeyId?: Prisma.StringFilter<"AIRequest"> | string;
    modelId?: Prisma.IntFilter<"AIRequest"> | number;
    serviceType?: Prisma.EnumAIServiceTypeFilter<"AIRequest"> | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonFilter<"AIRequest">;
    responsePayload?: Prisma.JsonNullableFilter<"AIRequest">;
    inputTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    outputTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    totalTokens?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    latency?: Prisma.IntNullableFilter<"AIRequest"> | number | null;
    requestCost?: Prisma.DecimalNullableFilter<"AIRequest"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFilter<"AIRequest"> | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFilter<"AIRequest"> | Date | string;
};
export type AIRequestCreateWithoutApiKeyInput = {
    id?: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    project: Prisma.ProjectCreateNestedOneWithoutAiRequestsInput;
    model: Prisma.AIModelCreateNestedOneWithoutRequestsInput;
    actionInvocations?: Prisma.ActionInvocationCreateNestedManyWithoutRequestInput;
};
export type AIRequestUncheckedCreateWithoutApiKeyInput = {
    id?: string;
    projectId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedCreateNestedManyWithoutRequestInput;
};
export type AIRequestCreateOrConnectWithoutApiKeyInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutApiKeyInput, Prisma.AIRequestUncheckedCreateWithoutApiKeyInput>;
};
export type AIRequestCreateManyApiKeyInputEnvelope = {
    data: Prisma.AIRequestCreateManyApiKeyInput | Prisma.AIRequestCreateManyApiKeyInput[];
    skipDuplicates?: boolean;
};
export type AIRequestUpsertWithWhereUniqueWithoutApiKeyInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    update: Prisma.XOR<Prisma.AIRequestUpdateWithoutApiKeyInput, Prisma.AIRequestUncheckedUpdateWithoutApiKeyInput>;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutApiKeyInput, Prisma.AIRequestUncheckedCreateWithoutApiKeyInput>;
};
export type AIRequestUpdateWithWhereUniqueWithoutApiKeyInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateWithoutApiKeyInput, Prisma.AIRequestUncheckedUpdateWithoutApiKeyInput>;
};
export type AIRequestUpdateManyWithWhereWithoutApiKeyInput = {
    where: Prisma.AIRequestScalarWhereInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateManyMutationInput, Prisma.AIRequestUncheckedUpdateManyWithoutApiKeyInput>;
};
export type AIRequestCreateWithoutModelInput = {
    id?: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    project: Prisma.ProjectCreateNestedOneWithoutAiRequestsInput;
    apiKey: Prisma.ApiKeyCreateNestedOneWithoutRequestsInput;
    actionInvocations?: Prisma.ActionInvocationCreateNestedManyWithoutRequestInput;
};
export type AIRequestUncheckedCreateWithoutModelInput = {
    id?: string;
    projectId: string;
    apiKeyId: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedCreateNestedManyWithoutRequestInput;
};
export type AIRequestCreateOrConnectWithoutModelInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutModelInput, Prisma.AIRequestUncheckedCreateWithoutModelInput>;
};
export type AIRequestCreateManyModelInputEnvelope = {
    data: Prisma.AIRequestCreateManyModelInput | Prisma.AIRequestCreateManyModelInput[];
    skipDuplicates?: boolean;
};
export type AIRequestUpsertWithWhereUniqueWithoutModelInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    update: Prisma.XOR<Prisma.AIRequestUpdateWithoutModelInput, Prisma.AIRequestUncheckedUpdateWithoutModelInput>;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutModelInput, Prisma.AIRequestUncheckedCreateWithoutModelInput>;
};
export type AIRequestUpdateWithWhereUniqueWithoutModelInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateWithoutModelInput, Prisma.AIRequestUncheckedUpdateWithoutModelInput>;
};
export type AIRequestUpdateManyWithWhereWithoutModelInput = {
    where: Prisma.AIRequestScalarWhereInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateManyMutationInput, Prisma.AIRequestUncheckedUpdateManyWithoutModelInput>;
};
export type AIRequestCreateWithoutActionInvocationsInput = {
    id?: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
    project: Prisma.ProjectCreateNestedOneWithoutAiRequestsInput;
    apiKey: Prisma.ApiKeyCreateNestedOneWithoutRequestsInput;
    model: Prisma.AIModelCreateNestedOneWithoutRequestsInput;
};
export type AIRequestUncheckedCreateWithoutActionInvocationsInput = {
    id?: string;
    projectId: string;
    apiKeyId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
};
export type AIRequestCreateOrConnectWithoutActionInvocationsInput = {
    where: Prisma.AIRequestWhereUniqueInput;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutActionInvocationsInput, Prisma.AIRequestUncheckedCreateWithoutActionInvocationsInput>;
};
export type AIRequestUpsertWithoutActionInvocationsInput = {
    update: Prisma.XOR<Prisma.AIRequestUpdateWithoutActionInvocationsInput, Prisma.AIRequestUncheckedUpdateWithoutActionInvocationsInput>;
    create: Prisma.XOR<Prisma.AIRequestCreateWithoutActionInvocationsInput, Prisma.AIRequestUncheckedCreateWithoutActionInvocationsInput>;
    where?: Prisma.AIRequestWhereInput;
};
export type AIRequestUpdateToOneWithWhereWithoutActionInvocationsInput = {
    where?: Prisma.AIRequestWhereInput;
    data: Prisma.XOR<Prisma.AIRequestUpdateWithoutActionInvocationsInput, Prisma.AIRequestUncheckedUpdateWithoutActionInvocationsInput>;
};
export type AIRequestUpdateWithoutActionInvocationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    project?: Prisma.ProjectUpdateOneRequiredWithoutAiRequestsNestedInput;
    apiKey?: Prisma.ApiKeyUpdateOneRequiredWithoutRequestsNestedInput;
    model?: Prisma.AIModelUpdateOneRequiredWithoutRequestsNestedInput;
};
export type AIRequestUncheckedUpdateWithoutActionInvocationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIRequestCreateManyProjectInput = {
    id?: string;
    apiKeyId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
};
export type AIRequestUpdateWithoutProjectInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    apiKey?: Prisma.ApiKeyUpdateOneRequiredWithoutRequestsNestedInput;
    model?: Prisma.AIModelUpdateOneRequiredWithoutRequestsNestedInput;
    actionInvocations?: Prisma.ActionInvocationUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateWithoutProjectInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateManyWithoutProjectInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIRequestCreateManyApiKeyInput = {
    id?: string;
    projectId: string;
    modelId: number;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
};
export type AIRequestUpdateWithoutApiKeyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    project?: Prisma.ProjectUpdateOneRequiredWithoutAiRequestsNestedInput;
    model?: Prisma.AIModelUpdateOneRequiredWithoutRequestsNestedInput;
    actionInvocations?: Prisma.ActionInvocationUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateWithoutApiKeyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateManyWithoutApiKeyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    modelId?: Prisma.IntFieldUpdateOperationsInput | number;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AIRequestCreateManyModelInput = {
    id?: string;
    projectId: string;
    apiKeyId: string;
    serviceType: $Enums.AIServiceType;
    requestPayload: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    latency?: number | null;
    requestCost?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: $Enums.AIRequestStatus;
    createdAt?: Date | string;
};
export type AIRequestUpdateWithoutModelInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    project?: Prisma.ProjectUpdateOneRequiredWithoutAiRequestsNestedInput;
    apiKey?: Prisma.ApiKeyUpdateOneRequiredWithoutRequestsNestedInput;
    actionInvocations?: Prisma.ActionInvocationUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateWithoutModelInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    actionInvocations?: Prisma.ActionInvocationUncheckedUpdateManyWithoutRequestNestedInput;
};
export type AIRequestUncheckedUpdateManyWithoutModelInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    apiKeyId?: Prisma.StringFieldUpdateOperationsInput | string;
    serviceType?: Prisma.EnumAIServiceTypeFieldUpdateOperationsInput | $Enums.AIServiceType;
    requestPayload?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    responsePayload?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    inputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    outputTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    totalTokens?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    latency?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    requestCost?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    requestStatus?: Prisma.EnumAIRequestStatusFieldUpdateOperationsInput | $Enums.AIRequestStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type AIRequestCountOutputType
 */
export type AIRequestCountOutputType = {
    actionInvocations: number;
};
export type AIRequestCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    actionInvocations?: boolean | AIRequestCountOutputTypeCountActionInvocationsArgs;
};
/**
 * AIRequestCountOutputType without action
 */
export type AIRequestCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequestCountOutputType
     */
    select?: Prisma.AIRequestCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * AIRequestCountOutputType without action
 */
export type AIRequestCountOutputTypeCountActionInvocationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ActionInvocationWhereInput;
};
export type AIRequestSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    projectId?: boolean;
    apiKeyId?: boolean;
    modelId?: boolean;
    serviceType?: boolean;
    requestPayload?: boolean;
    responsePayload?: boolean;
    inputTokens?: boolean;
    outputTokens?: boolean;
    totalTokens?: boolean;
    latency?: boolean;
    requestCost?: boolean;
    requestStatus?: boolean;
    createdAt?: boolean;
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
    apiKey?: boolean | Prisma.ApiKeyDefaultArgs<ExtArgs>;
    model?: boolean | Prisma.AIModelDefaultArgs<ExtArgs>;
    actionInvocations?: boolean | Prisma.AIRequest$actionInvocationsArgs<ExtArgs>;
    _count?: boolean | Prisma.AIRequestCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["aIRequest"]>;
export type AIRequestSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    projectId?: boolean;
    apiKeyId?: boolean;
    modelId?: boolean;
    serviceType?: boolean;
    requestPayload?: boolean;
    responsePayload?: boolean;
    inputTokens?: boolean;
    outputTokens?: boolean;
    totalTokens?: boolean;
    latency?: boolean;
    requestCost?: boolean;
    requestStatus?: boolean;
    createdAt?: boolean;
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
    apiKey?: boolean | Prisma.ApiKeyDefaultArgs<ExtArgs>;
    model?: boolean | Prisma.AIModelDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["aIRequest"]>;
export type AIRequestSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    projectId?: boolean;
    apiKeyId?: boolean;
    modelId?: boolean;
    serviceType?: boolean;
    requestPayload?: boolean;
    responsePayload?: boolean;
    inputTokens?: boolean;
    outputTokens?: boolean;
    totalTokens?: boolean;
    latency?: boolean;
    requestCost?: boolean;
    requestStatus?: boolean;
    createdAt?: boolean;
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
    apiKey?: boolean | Prisma.ApiKeyDefaultArgs<ExtArgs>;
    model?: boolean | Prisma.AIModelDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["aIRequest"]>;
export type AIRequestSelectScalar = {
    id?: boolean;
    projectId?: boolean;
    apiKeyId?: boolean;
    modelId?: boolean;
    serviceType?: boolean;
    requestPayload?: boolean;
    responsePayload?: boolean;
    inputTokens?: boolean;
    outputTokens?: boolean;
    totalTokens?: boolean;
    latency?: boolean;
    requestCost?: boolean;
    requestStatus?: boolean;
    createdAt?: boolean;
};
export type AIRequestOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "projectId" | "apiKeyId" | "modelId" | "serviceType" | "requestPayload" | "responsePayload" | "inputTokens" | "outputTokens" | "totalTokens" | "latency" | "requestCost" | "requestStatus" | "createdAt", ExtArgs["result"]["aIRequest"]>;
export type AIRequestInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
    apiKey?: boolean | Prisma.ApiKeyDefaultArgs<ExtArgs>;
    model?: boolean | Prisma.AIModelDefaultArgs<ExtArgs>;
    actionInvocations?: boolean | Prisma.AIRequest$actionInvocationsArgs<ExtArgs>;
    _count?: boolean | Prisma.AIRequestCountOutputTypeDefaultArgs<ExtArgs>;
};
export type AIRequestIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
    apiKey?: boolean | Prisma.ApiKeyDefaultArgs<ExtArgs>;
    model?: boolean | Prisma.AIModelDefaultArgs<ExtArgs>;
};
export type AIRequestIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
    apiKey?: boolean | Prisma.ApiKeyDefaultArgs<ExtArgs>;
    model?: boolean | Prisma.AIModelDefaultArgs<ExtArgs>;
};
export type $AIRequestPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AIRequest";
    objects: {
        project: Prisma.$ProjectPayload<ExtArgs>;
        apiKey: Prisma.$ApiKeyPayload<ExtArgs>;
        model: Prisma.$AIModelPayload<ExtArgs>;
        actionInvocations: Prisma.$ActionInvocationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        projectId: string;
        apiKeyId: string;
        modelId: number;
        serviceType: $Enums.AIServiceType;
        requestPayload: runtime.JsonValue;
        responsePayload: runtime.JsonValue | null;
        inputTokens: number | null;
        outputTokens: number | null;
        totalTokens: number | null;
        latency: number | null;
        requestCost: runtime.Decimal | null;
        requestStatus: $Enums.AIRequestStatus;
        createdAt: Date;
    }, ExtArgs["result"]["aIRequest"]>;
    composites: {};
};
export type AIRequestGetPayload<S extends boolean | null | undefined | AIRequestDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AIRequestPayload, S>;
export type AIRequestCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AIRequestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AIRequestCountAggregateInputType | true;
};
export interface AIRequestDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['AIRequest'];
        meta: {
            name: 'AIRequest';
        };
    };
    /**
     * Find zero or one AIRequest that matches the filter.
     * @param {AIRequestFindUniqueArgs} args - Arguments to find a AIRequest
     * @example
     * // Get one AIRequest
     * const aIRequest = await prisma.aIRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AIRequestFindUniqueArgs>(args: Prisma.SelectSubset<T, AIRequestFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one AIRequest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AIRequestFindUniqueOrThrowArgs} args - Arguments to find a AIRequest
     * @example
     * // Get one AIRequest
     * const aIRequest = await prisma.aIRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AIRequestFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AIRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first AIRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestFindFirstArgs} args - Arguments to find a AIRequest
     * @example
     * // Get one AIRequest
     * const aIRequest = await prisma.aIRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AIRequestFindFirstArgs>(args?: Prisma.SelectSubset<T, AIRequestFindFirstArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first AIRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestFindFirstOrThrowArgs} args - Arguments to find a AIRequest
     * @example
     * // Get one AIRequest
     * const aIRequest = await prisma.aIRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AIRequestFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AIRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more AIRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AIRequests
     * const aIRequests = await prisma.aIRequest.findMany()
     *
     * // Get first 10 AIRequests
     * const aIRequests = await prisma.aIRequest.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const aIRequestWithIdOnly = await prisma.aIRequest.findMany({ select: { id: true } })
     *
     */
    findMany<T extends AIRequestFindManyArgs>(args?: Prisma.SelectSubset<T, AIRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a AIRequest.
     * @param {AIRequestCreateArgs} args - Arguments to create a AIRequest.
     * @example
     * // Create one AIRequest
     * const AIRequest = await prisma.aIRequest.create({
     *   data: {
     *     // ... data to create a AIRequest
     *   }
     * })
     *
     */
    create<T extends AIRequestCreateArgs>(args: Prisma.SelectSubset<T, AIRequestCreateArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many AIRequests.
     * @param {AIRequestCreateManyArgs} args - Arguments to create many AIRequests.
     * @example
     * // Create many AIRequests
     * const aIRequest = await prisma.aIRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends AIRequestCreateManyArgs>(args?: Prisma.SelectSubset<T, AIRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many AIRequests and returns the data saved in the database.
     * @param {AIRequestCreateManyAndReturnArgs} args - Arguments to create many AIRequests.
     * @example
     * // Create many AIRequests
     * const aIRequest = await prisma.aIRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many AIRequests and only return the `id`
     * const aIRequestWithIdOnly = await prisma.aIRequest.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends AIRequestCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AIRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a AIRequest.
     * @param {AIRequestDeleteArgs} args - Arguments to delete one AIRequest.
     * @example
     * // Delete one AIRequest
     * const AIRequest = await prisma.aIRequest.delete({
     *   where: {
     *     // ... filter to delete one AIRequest
     *   }
     * })
     *
     */
    delete<T extends AIRequestDeleteArgs>(args: Prisma.SelectSubset<T, AIRequestDeleteArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one AIRequest.
     * @param {AIRequestUpdateArgs} args - Arguments to update one AIRequest.
     * @example
     * // Update one AIRequest
     * const aIRequest = await prisma.aIRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends AIRequestUpdateArgs>(args: Prisma.SelectSubset<T, AIRequestUpdateArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more AIRequests.
     * @param {AIRequestDeleteManyArgs} args - Arguments to filter AIRequests to delete.
     * @example
     * // Delete a few AIRequests
     * const { count } = await prisma.aIRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends AIRequestDeleteManyArgs>(args?: Prisma.SelectSubset<T, AIRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more AIRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AIRequests
     * const aIRequest = await prisma.aIRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends AIRequestUpdateManyArgs>(args: Prisma.SelectSubset<T, AIRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more AIRequests and returns the data updated in the database.
     * @param {AIRequestUpdateManyAndReturnArgs} args - Arguments to update many AIRequests.
     * @example
     * // Update many AIRequests
     * const aIRequest = await prisma.aIRequest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more AIRequests and only return the `id`
     * const aIRequestWithIdOnly = await prisma.aIRequest.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends AIRequestUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AIRequestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one AIRequest.
     * @param {AIRequestUpsertArgs} args - Arguments to update or create a AIRequest.
     * @example
     * // Update or create a AIRequest
     * const aIRequest = await prisma.aIRequest.upsert({
     *   create: {
     *     // ... data to create a AIRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AIRequest we want to update
     *   }
     * })
     */
    upsert<T extends AIRequestUpsertArgs>(args: Prisma.SelectSubset<T, AIRequestUpsertArgs<ExtArgs>>): Prisma.Prisma__AIRequestClient<runtime.Types.Result.GetResult<Prisma.$AIRequestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of AIRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestCountArgs} args - Arguments to filter AIRequests to count.
     * @example
     * // Count the number of AIRequests
     * const count = await prisma.aIRequest.count({
     *   where: {
     *     // ... the filter for the AIRequests we want to count
     *   }
     * })
    **/
    count<T extends AIRequestCountArgs>(args?: Prisma.Subset<T, AIRequestCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AIRequestCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a AIRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AIRequestAggregateArgs>(args: Prisma.Subset<T, AIRequestAggregateArgs>): Prisma.PrismaPromise<GetAIRequestAggregateType<T>>;
    /**
     * Group by AIRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIRequestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends AIRequestGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AIRequestGroupByArgs['orderBy'];
    } : {
        orderBy?: AIRequestGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AIRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAIRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the AIRequest model
     */
    readonly fields: AIRequestFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for AIRequest.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__AIRequestClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    project<T extends Prisma.ProjectDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ProjectDefaultArgs<ExtArgs>>): Prisma.Prisma__ProjectClient<runtime.Types.Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    apiKey<T extends Prisma.ApiKeyDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ApiKeyDefaultArgs<ExtArgs>>): Prisma.Prisma__ApiKeyClient<runtime.Types.Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    model<T extends Prisma.AIModelDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AIModelDefaultArgs<ExtArgs>>): Prisma.Prisma__AIModelClient<runtime.Types.Result.GetResult<Prisma.$AIModelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    actionInvocations<T extends Prisma.AIRequest$actionInvocationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.AIRequest$actionInvocationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ActionInvocationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the AIRequest model
 */
export interface AIRequestFieldRefs {
    readonly id: Prisma.FieldRef<"AIRequest", 'String'>;
    readonly projectId: Prisma.FieldRef<"AIRequest", 'String'>;
    readonly apiKeyId: Prisma.FieldRef<"AIRequest", 'String'>;
    readonly modelId: Prisma.FieldRef<"AIRequest", 'Int'>;
    readonly serviceType: Prisma.FieldRef<"AIRequest", 'AIServiceType'>;
    readonly requestPayload: Prisma.FieldRef<"AIRequest", 'Json'>;
    readonly responsePayload: Prisma.FieldRef<"AIRequest", 'Json'>;
    readonly inputTokens: Prisma.FieldRef<"AIRequest", 'Int'>;
    readonly outputTokens: Prisma.FieldRef<"AIRequest", 'Int'>;
    readonly totalTokens: Prisma.FieldRef<"AIRequest", 'Int'>;
    readonly latency: Prisma.FieldRef<"AIRequest", 'Int'>;
    readonly requestCost: Prisma.FieldRef<"AIRequest", 'Decimal'>;
    readonly requestStatus: Prisma.FieldRef<"AIRequest", 'AIRequestStatus'>;
    readonly createdAt: Prisma.FieldRef<"AIRequest", 'DateTime'>;
}
/**
 * AIRequest findUnique
 */
export type AIRequestFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * Filter, which AIRequest to fetch.
     */
    where: Prisma.AIRequestWhereUniqueInput;
};
/**
 * AIRequest findUniqueOrThrow
 */
export type AIRequestFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * Filter, which AIRequest to fetch.
     */
    where: Prisma.AIRequestWhereUniqueInput;
};
/**
 * AIRequest findFirst
 */
export type AIRequestFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * Filter, which AIRequest to fetch.
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AIRequests to fetch.
     */
    orderBy?: Prisma.AIRequestOrderByWithRelationInput | Prisma.AIRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for AIRequests.
     */
    cursor?: Prisma.AIRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AIRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AIRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of AIRequests.
     */
    distinct?: Prisma.AIRequestScalarFieldEnum | Prisma.AIRequestScalarFieldEnum[];
};
/**
 * AIRequest findFirstOrThrow
 */
export type AIRequestFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * Filter, which AIRequest to fetch.
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AIRequests to fetch.
     */
    orderBy?: Prisma.AIRequestOrderByWithRelationInput | Prisma.AIRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for AIRequests.
     */
    cursor?: Prisma.AIRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AIRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AIRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of AIRequests.
     */
    distinct?: Prisma.AIRequestScalarFieldEnum | Prisma.AIRequestScalarFieldEnum[];
};
/**
 * AIRequest findMany
 */
export type AIRequestFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * Filter, which AIRequests to fetch.
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of AIRequests to fetch.
     */
    orderBy?: Prisma.AIRequestOrderByWithRelationInput | Prisma.AIRequestOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing AIRequests.
     */
    cursor?: Prisma.AIRequestWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` AIRequests from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` AIRequests.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of AIRequests.
     */
    distinct?: Prisma.AIRequestScalarFieldEnum | Prisma.AIRequestScalarFieldEnum[];
};
/**
 * AIRequest create
 */
export type AIRequestCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * The data needed to create a AIRequest.
     */
    data: Prisma.XOR<Prisma.AIRequestCreateInput, Prisma.AIRequestUncheckedCreateInput>;
};
/**
 * AIRequest createMany
 */
export type AIRequestCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many AIRequests.
     */
    data: Prisma.AIRequestCreateManyInput | Prisma.AIRequestCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * AIRequest createManyAndReturn
 */
export type AIRequestCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * The data used to create many AIRequests.
     */
    data: Prisma.AIRequestCreateManyInput | Prisma.AIRequestCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * AIRequest update
 */
export type AIRequestUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * The data needed to update a AIRequest.
     */
    data: Prisma.XOR<Prisma.AIRequestUpdateInput, Prisma.AIRequestUncheckedUpdateInput>;
    /**
     * Choose, which AIRequest to update.
     */
    where: Prisma.AIRequestWhereUniqueInput;
};
/**
 * AIRequest updateMany
 */
export type AIRequestUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update AIRequests.
     */
    data: Prisma.XOR<Prisma.AIRequestUpdateManyMutationInput, Prisma.AIRequestUncheckedUpdateManyInput>;
    /**
     * Filter which AIRequests to update
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * Limit how many AIRequests to update.
     */
    limit?: number;
};
/**
 * AIRequest updateManyAndReturn
 */
export type AIRequestUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * The data used to update AIRequests.
     */
    data: Prisma.XOR<Prisma.AIRequestUpdateManyMutationInput, Prisma.AIRequestUncheckedUpdateManyInput>;
    /**
     * Filter which AIRequests to update
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * Limit how many AIRequests to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * AIRequest upsert
 */
export type AIRequestUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * The filter to search for the AIRequest to update in case it exists.
     */
    where: Prisma.AIRequestWhereUniqueInput;
    /**
     * In case the AIRequest found by the `where` argument doesn't exist, create a new AIRequest with this data.
     */
    create: Prisma.XOR<Prisma.AIRequestCreateInput, Prisma.AIRequestUncheckedCreateInput>;
    /**
     * In case the AIRequest was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.AIRequestUpdateInput, Prisma.AIRequestUncheckedUpdateInput>;
};
/**
 * AIRequest delete
 */
export type AIRequestDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
    /**
     * Filter which AIRequest to delete.
     */
    where: Prisma.AIRequestWhereUniqueInput;
};
/**
 * AIRequest deleteMany
 */
export type AIRequestDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which AIRequests to delete
     */
    where?: Prisma.AIRequestWhereInput;
    /**
     * Limit how many AIRequests to delete.
     */
    limit?: number;
};
/**
 * AIRequest.actionInvocations
 */
export type AIRequest$actionInvocationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActionInvocation
     */
    select?: Prisma.ActionInvocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ActionInvocation
     */
    omit?: Prisma.ActionInvocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ActionInvocationInclude<ExtArgs> | null;
    where?: Prisma.ActionInvocationWhereInput;
    orderBy?: Prisma.ActionInvocationOrderByWithRelationInput | Prisma.ActionInvocationOrderByWithRelationInput[];
    cursor?: Prisma.ActionInvocationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ActionInvocationScalarFieldEnum | Prisma.ActionInvocationScalarFieldEnum[];
};
/**
 * AIRequest without action
 */
export type AIRequestDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIRequest
     */
    select?: Prisma.AIRequestSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the AIRequest
     */
    omit?: Prisma.AIRequestOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AIRequestInclude<ExtArgs> | null;
};
//# sourceMappingURL=AIRequest.d.ts.map