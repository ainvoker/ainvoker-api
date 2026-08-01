import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model UsageAnalytics
 *
 */
export type UsageAnalyticsModel = runtime.Types.Result.DefaultSelection<Prisma.$UsageAnalyticsPayload>;
export type AggregateUsageAnalytics = {
    _count: UsageAnalyticsCountAggregateOutputType | null;
    _avg: UsageAnalyticsAvgAggregateOutputType | null;
    _sum: UsageAnalyticsSumAggregateOutputType | null;
    _min: UsageAnalyticsMinAggregateOutputType | null;
    _max: UsageAnalyticsMaxAggregateOutputType | null;
};
export type UsageAnalyticsAvgAggregateOutputType = {
    totalRequests: number | null;
    successfulRequests: number | null;
    failedRequests: number | null;
    totalTokens: number | null;
    totalCost: runtime.Decimal | null;
    month: number | null;
    year: number | null;
};
export type UsageAnalyticsSumAggregateOutputType = {
    totalRequests: number | null;
    successfulRequests: number | null;
    failedRequests: number | null;
    totalTokens: number | null;
    totalCost: runtime.Decimal | null;
    month: number | null;
    year: number | null;
};
export type UsageAnalyticsMinAggregateOutputType = {
    id: string | null;
    projectId: string | null;
    totalRequests: number | null;
    successfulRequests: number | null;
    failedRequests: number | null;
    totalTokens: number | null;
    totalCost: runtime.Decimal | null;
    month: number | null;
    year: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UsageAnalyticsMaxAggregateOutputType = {
    id: string | null;
    projectId: string | null;
    totalRequests: number | null;
    successfulRequests: number | null;
    failedRequests: number | null;
    totalTokens: number | null;
    totalCost: runtime.Decimal | null;
    month: number | null;
    year: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UsageAnalyticsCountAggregateOutputType = {
    id: number;
    projectId: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
    totalCost: number;
    month: number;
    year: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type UsageAnalyticsAvgAggregateInputType = {
    totalRequests?: true;
    successfulRequests?: true;
    failedRequests?: true;
    totalTokens?: true;
    totalCost?: true;
    month?: true;
    year?: true;
};
export type UsageAnalyticsSumAggregateInputType = {
    totalRequests?: true;
    successfulRequests?: true;
    failedRequests?: true;
    totalTokens?: true;
    totalCost?: true;
    month?: true;
    year?: true;
};
export type UsageAnalyticsMinAggregateInputType = {
    id?: true;
    projectId?: true;
    totalRequests?: true;
    successfulRequests?: true;
    failedRequests?: true;
    totalTokens?: true;
    totalCost?: true;
    month?: true;
    year?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UsageAnalyticsMaxAggregateInputType = {
    id?: true;
    projectId?: true;
    totalRequests?: true;
    successfulRequests?: true;
    failedRequests?: true;
    totalTokens?: true;
    totalCost?: true;
    month?: true;
    year?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UsageAnalyticsCountAggregateInputType = {
    id?: true;
    projectId?: true;
    totalRequests?: true;
    successfulRequests?: true;
    failedRequests?: true;
    totalTokens?: true;
    totalCost?: true;
    month?: true;
    year?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type UsageAnalyticsAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which UsageAnalytics to aggregate.
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UsageAnalytics to fetch.
     */
    orderBy?: Prisma.UsageAnalyticsOrderByWithRelationInput | Prisma.UsageAnalyticsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.UsageAnalyticsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UsageAnalytics from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UsageAnalytics.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned UsageAnalytics
    **/
    _count?: true | UsageAnalyticsCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: UsageAnalyticsAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: UsageAnalyticsSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: UsageAnalyticsMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: UsageAnalyticsMaxAggregateInputType;
};
export type GetUsageAnalyticsAggregateType<T extends UsageAnalyticsAggregateArgs> = {
    [P in keyof T & keyof AggregateUsageAnalytics]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUsageAnalytics[P]> : Prisma.GetScalarType<T[P], AggregateUsageAnalytics[P]>;
};
export type UsageAnalyticsGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UsageAnalyticsWhereInput;
    orderBy?: Prisma.UsageAnalyticsOrderByWithAggregationInput | Prisma.UsageAnalyticsOrderByWithAggregationInput[];
    by: Prisma.UsageAnalyticsScalarFieldEnum[] | Prisma.UsageAnalyticsScalarFieldEnum;
    having?: Prisma.UsageAnalyticsScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UsageAnalyticsCountAggregateInputType | true;
    _avg?: UsageAnalyticsAvgAggregateInputType;
    _sum?: UsageAnalyticsSumAggregateInputType;
    _min?: UsageAnalyticsMinAggregateInputType;
    _max?: UsageAnalyticsMaxAggregateInputType;
};
export type UsageAnalyticsGroupByOutputType = {
    id: string;
    projectId: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
    totalCost: runtime.Decimal;
    month: number;
    year: number;
    createdAt: Date;
    updatedAt: Date;
    _count: UsageAnalyticsCountAggregateOutputType | null;
    _avg: UsageAnalyticsAvgAggregateOutputType | null;
    _sum: UsageAnalyticsSumAggregateOutputType | null;
    _min: UsageAnalyticsMinAggregateOutputType | null;
    _max: UsageAnalyticsMaxAggregateOutputType | null;
};
export type GetUsageAnalyticsGroupByPayload<T extends UsageAnalyticsGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UsageAnalyticsGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UsageAnalyticsGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UsageAnalyticsGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UsageAnalyticsGroupByOutputType[P]>;
}>>;
export type UsageAnalyticsWhereInput = {
    AND?: Prisma.UsageAnalyticsWhereInput | Prisma.UsageAnalyticsWhereInput[];
    OR?: Prisma.UsageAnalyticsWhereInput[];
    NOT?: Prisma.UsageAnalyticsWhereInput | Prisma.UsageAnalyticsWhereInput[];
    id?: Prisma.StringFilter<"UsageAnalytics"> | string;
    projectId?: Prisma.StringFilter<"UsageAnalytics"> | string;
    totalRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    successfulRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    failedRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    totalTokens?: Prisma.IntFilter<"UsageAnalytics"> | number;
    totalCost?: Prisma.DecimalFilter<"UsageAnalytics"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFilter<"UsageAnalytics"> | number;
    year?: Prisma.IntFilter<"UsageAnalytics"> | number;
    createdAt?: Prisma.DateTimeFilter<"UsageAnalytics"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UsageAnalytics"> | Date | string;
    project?: Prisma.XOR<Prisma.ProjectScalarRelationFilter, Prisma.ProjectWhereInput>;
};
export type UsageAnalyticsOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    project?: Prisma.ProjectOrderByWithRelationInput;
};
export type UsageAnalyticsWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    projectId_month_year?: Prisma.UsageAnalyticsProjectIdMonthYearCompoundUniqueInput;
    AND?: Prisma.UsageAnalyticsWhereInput | Prisma.UsageAnalyticsWhereInput[];
    OR?: Prisma.UsageAnalyticsWhereInput[];
    NOT?: Prisma.UsageAnalyticsWhereInput | Prisma.UsageAnalyticsWhereInput[];
    projectId?: Prisma.StringFilter<"UsageAnalytics"> | string;
    totalRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    successfulRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    failedRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    totalTokens?: Prisma.IntFilter<"UsageAnalytics"> | number;
    totalCost?: Prisma.DecimalFilter<"UsageAnalytics"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFilter<"UsageAnalytics"> | number;
    year?: Prisma.IntFilter<"UsageAnalytics"> | number;
    createdAt?: Prisma.DateTimeFilter<"UsageAnalytics"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UsageAnalytics"> | Date | string;
    project?: Prisma.XOR<Prisma.ProjectScalarRelationFilter, Prisma.ProjectWhereInput>;
}, "id" | "projectId_month_year">;
export type UsageAnalyticsOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.UsageAnalyticsCountOrderByAggregateInput;
    _avg?: Prisma.UsageAnalyticsAvgOrderByAggregateInput;
    _max?: Prisma.UsageAnalyticsMaxOrderByAggregateInput;
    _min?: Prisma.UsageAnalyticsMinOrderByAggregateInput;
    _sum?: Prisma.UsageAnalyticsSumOrderByAggregateInput;
};
export type UsageAnalyticsScalarWhereWithAggregatesInput = {
    AND?: Prisma.UsageAnalyticsScalarWhereWithAggregatesInput | Prisma.UsageAnalyticsScalarWhereWithAggregatesInput[];
    OR?: Prisma.UsageAnalyticsScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UsageAnalyticsScalarWhereWithAggregatesInput | Prisma.UsageAnalyticsScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"UsageAnalytics"> | string;
    projectId?: Prisma.StringWithAggregatesFilter<"UsageAnalytics"> | string;
    totalRequests?: Prisma.IntWithAggregatesFilter<"UsageAnalytics"> | number;
    successfulRequests?: Prisma.IntWithAggregatesFilter<"UsageAnalytics"> | number;
    failedRequests?: Prisma.IntWithAggregatesFilter<"UsageAnalytics"> | number;
    totalTokens?: Prisma.IntWithAggregatesFilter<"UsageAnalytics"> | number;
    totalCost?: Prisma.DecimalWithAggregatesFilter<"UsageAnalytics"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntWithAggregatesFilter<"UsageAnalytics"> | number;
    year?: Prisma.IntWithAggregatesFilter<"UsageAnalytics"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"UsageAnalytics"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"UsageAnalytics"> | Date | string;
};
export type UsageAnalyticsCreateInput = {
    id?: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    totalTokens?: number;
    totalCost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    month: number;
    year: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    project: Prisma.ProjectCreateNestedOneWithoutUsageAnalyticsInput;
};
export type UsageAnalyticsUncheckedCreateInput = {
    id?: string;
    projectId: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    totalTokens?: number;
    totalCost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    month: number;
    year: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UsageAnalyticsUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    project?: Prisma.ProjectUpdateOneRequiredWithoutUsageAnalyticsNestedInput;
};
export type UsageAnalyticsUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UsageAnalyticsCreateManyInput = {
    id?: string;
    projectId: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    totalTokens?: number;
    totalCost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    month: number;
    year: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UsageAnalyticsUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UsageAnalyticsUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    projectId?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UsageAnalyticsListRelationFilter = {
    every?: Prisma.UsageAnalyticsWhereInput;
    some?: Prisma.UsageAnalyticsWhereInput;
    none?: Prisma.UsageAnalyticsWhereInput;
};
export type UsageAnalyticsOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type UsageAnalyticsProjectIdMonthYearCompoundUniqueInput = {
    projectId: string;
    month: number;
    year: number;
};
export type UsageAnalyticsCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UsageAnalyticsAvgOrderByAggregateInput = {
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
};
export type UsageAnalyticsMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UsageAnalyticsMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    projectId?: Prisma.SortOrder;
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UsageAnalyticsSumOrderByAggregateInput = {
    totalRequests?: Prisma.SortOrder;
    successfulRequests?: Prisma.SortOrder;
    failedRequests?: Prisma.SortOrder;
    totalTokens?: Prisma.SortOrder;
    totalCost?: Prisma.SortOrder;
    month?: Prisma.SortOrder;
    year?: Prisma.SortOrder;
};
export type UsageAnalyticsCreateNestedManyWithoutProjectInput = {
    create?: Prisma.XOR<Prisma.UsageAnalyticsCreateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput> | Prisma.UsageAnalyticsCreateWithoutProjectInput[] | Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput | Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput[];
    createMany?: Prisma.UsageAnalyticsCreateManyProjectInputEnvelope;
    connect?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
};
export type UsageAnalyticsUncheckedCreateNestedManyWithoutProjectInput = {
    create?: Prisma.XOR<Prisma.UsageAnalyticsCreateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput> | Prisma.UsageAnalyticsCreateWithoutProjectInput[] | Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput | Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput[];
    createMany?: Prisma.UsageAnalyticsCreateManyProjectInputEnvelope;
    connect?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
};
export type UsageAnalyticsUpdateManyWithoutProjectNestedInput = {
    create?: Prisma.XOR<Prisma.UsageAnalyticsCreateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput> | Prisma.UsageAnalyticsCreateWithoutProjectInput[] | Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput | Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput[];
    upsert?: Prisma.UsageAnalyticsUpsertWithWhereUniqueWithoutProjectInput | Prisma.UsageAnalyticsUpsertWithWhereUniqueWithoutProjectInput[];
    createMany?: Prisma.UsageAnalyticsCreateManyProjectInputEnvelope;
    set?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    disconnect?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    delete?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    connect?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    update?: Prisma.UsageAnalyticsUpdateWithWhereUniqueWithoutProjectInput | Prisma.UsageAnalyticsUpdateWithWhereUniqueWithoutProjectInput[];
    updateMany?: Prisma.UsageAnalyticsUpdateManyWithWhereWithoutProjectInput | Prisma.UsageAnalyticsUpdateManyWithWhereWithoutProjectInput[];
    deleteMany?: Prisma.UsageAnalyticsScalarWhereInput | Prisma.UsageAnalyticsScalarWhereInput[];
};
export type UsageAnalyticsUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: Prisma.XOR<Prisma.UsageAnalyticsCreateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput> | Prisma.UsageAnalyticsCreateWithoutProjectInput[] | Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput[];
    connectOrCreate?: Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput | Prisma.UsageAnalyticsCreateOrConnectWithoutProjectInput[];
    upsert?: Prisma.UsageAnalyticsUpsertWithWhereUniqueWithoutProjectInput | Prisma.UsageAnalyticsUpsertWithWhereUniqueWithoutProjectInput[];
    createMany?: Prisma.UsageAnalyticsCreateManyProjectInputEnvelope;
    set?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    disconnect?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    delete?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    connect?: Prisma.UsageAnalyticsWhereUniqueInput | Prisma.UsageAnalyticsWhereUniqueInput[];
    update?: Prisma.UsageAnalyticsUpdateWithWhereUniqueWithoutProjectInput | Prisma.UsageAnalyticsUpdateWithWhereUniqueWithoutProjectInput[];
    updateMany?: Prisma.UsageAnalyticsUpdateManyWithWhereWithoutProjectInput | Prisma.UsageAnalyticsUpdateManyWithWhereWithoutProjectInput[];
    deleteMany?: Prisma.UsageAnalyticsScalarWhereInput | Prisma.UsageAnalyticsScalarWhereInput[];
};
export type UsageAnalyticsCreateWithoutProjectInput = {
    id?: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    totalTokens?: number;
    totalCost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    month: number;
    year: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UsageAnalyticsUncheckedCreateWithoutProjectInput = {
    id?: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    totalTokens?: number;
    totalCost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    month: number;
    year: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UsageAnalyticsCreateOrConnectWithoutProjectInput = {
    where: Prisma.UsageAnalyticsWhereUniqueInput;
    create: Prisma.XOR<Prisma.UsageAnalyticsCreateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput>;
};
export type UsageAnalyticsCreateManyProjectInputEnvelope = {
    data: Prisma.UsageAnalyticsCreateManyProjectInput | Prisma.UsageAnalyticsCreateManyProjectInput[];
    skipDuplicates?: boolean;
};
export type UsageAnalyticsUpsertWithWhereUniqueWithoutProjectInput = {
    where: Prisma.UsageAnalyticsWhereUniqueInput;
    update: Prisma.XOR<Prisma.UsageAnalyticsUpdateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedUpdateWithoutProjectInput>;
    create: Prisma.XOR<Prisma.UsageAnalyticsCreateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedCreateWithoutProjectInput>;
};
export type UsageAnalyticsUpdateWithWhereUniqueWithoutProjectInput = {
    where: Prisma.UsageAnalyticsWhereUniqueInput;
    data: Prisma.XOR<Prisma.UsageAnalyticsUpdateWithoutProjectInput, Prisma.UsageAnalyticsUncheckedUpdateWithoutProjectInput>;
};
export type UsageAnalyticsUpdateManyWithWhereWithoutProjectInput = {
    where: Prisma.UsageAnalyticsScalarWhereInput;
    data: Prisma.XOR<Prisma.UsageAnalyticsUpdateManyMutationInput, Prisma.UsageAnalyticsUncheckedUpdateManyWithoutProjectInput>;
};
export type UsageAnalyticsScalarWhereInput = {
    AND?: Prisma.UsageAnalyticsScalarWhereInput | Prisma.UsageAnalyticsScalarWhereInput[];
    OR?: Prisma.UsageAnalyticsScalarWhereInput[];
    NOT?: Prisma.UsageAnalyticsScalarWhereInput | Prisma.UsageAnalyticsScalarWhereInput[];
    id?: Prisma.StringFilter<"UsageAnalytics"> | string;
    projectId?: Prisma.StringFilter<"UsageAnalytics"> | string;
    totalRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    successfulRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    failedRequests?: Prisma.IntFilter<"UsageAnalytics"> | number;
    totalTokens?: Prisma.IntFilter<"UsageAnalytics"> | number;
    totalCost?: Prisma.DecimalFilter<"UsageAnalytics"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFilter<"UsageAnalytics"> | number;
    year?: Prisma.IntFilter<"UsageAnalytics"> | number;
    createdAt?: Prisma.DateTimeFilter<"UsageAnalytics"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UsageAnalytics"> | Date | string;
};
export type UsageAnalyticsCreateManyProjectInput = {
    id?: string;
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    totalTokens?: number;
    totalCost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    month: number;
    year: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UsageAnalyticsUpdateWithoutProjectInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UsageAnalyticsUncheckedUpdateWithoutProjectInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UsageAnalyticsUncheckedUpdateManyWithoutProjectInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    totalRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    successfulRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    failedRequests?: Prisma.IntFieldUpdateOperationsInput | number;
    totalTokens?: Prisma.IntFieldUpdateOperationsInput | number;
    totalCost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    month?: Prisma.IntFieldUpdateOperationsInput | number;
    year?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UsageAnalyticsSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    projectId?: boolean;
    totalRequests?: boolean;
    successfulRequests?: boolean;
    failedRequests?: boolean;
    totalTokens?: boolean;
    totalCost?: boolean;
    month?: boolean;
    year?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["usageAnalytics"]>;
export type UsageAnalyticsSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    projectId?: boolean;
    totalRequests?: boolean;
    successfulRequests?: boolean;
    failedRequests?: boolean;
    totalTokens?: boolean;
    totalCost?: boolean;
    month?: boolean;
    year?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["usageAnalytics"]>;
export type UsageAnalyticsSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    projectId?: boolean;
    totalRequests?: boolean;
    successfulRequests?: boolean;
    failedRequests?: boolean;
    totalTokens?: boolean;
    totalCost?: boolean;
    month?: boolean;
    year?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["usageAnalytics"]>;
export type UsageAnalyticsSelectScalar = {
    id?: boolean;
    projectId?: boolean;
    totalRequests?: boolean;
    successfulRequests?: boolean;
    failedRequests?: boolean;
    totalTokens?: boolean;
    totalCost?: boolean;
    month?: boolean;
    year?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type UsageAnalyticsOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "projectId" | "totalRequests" | "successfulRequests" | "failedRequests" | "totalTokens" | "totalCost" | "month" | "year" | "createdAt" | "updatedAt", ExtArgs["result"]["usageAnalytics"]>;
export type UsageAnalyticsInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
};
export type UsageAnalyticsIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
};
export type UsageAnalyticsIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    project?: boolean | Prisma.ProjectDefaultArgs<ExtArgs>;
};
export type $UsageAnalyticsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UsageAnalytics";
    objects: {
        project: Prisma.$ProjectPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        projectId: string;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        totalTokens: number;
        totalCost: runtime.Decimal;
        month: number;
        year: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["usageAnalytics"]>;
    composites: {};
};
export type UsageAnalyticsGetPayload<S extends boolean | null | undefined | UsageAnalyticsDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload, S>;
export type UsageAnalyticsCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UsageAnalyticsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UsageAnalyticsCountAggregateInputType | true;
};
export interface UsageAnalyticsDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['UsageAnalytics'];
        meta: {
            name: 'UsageAnalytics';
        };
    };
    /**
     * Find zero or one UsageAnalytics that matches the filter.
     * @param {UsageAnalyticsFindUniqueArgs} args - Arguments to find a UsageAnalytics
     * @example
     * // Get one UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UsageAnalyticsFindUniqueArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one UsageAnalytics that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UsageAnalyticsFindUniqueOrThrowArgs} args - Arguments to find a UsageAnalytics
     * @example
     * // Get one UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UsageAnalyticsFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first UsageAnalytics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsFindFirstArgs} args - Arguments to find a UsageAnalytics
     * @example
     * // Get one UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UsageAnalyticsFindFirstArgs>(args?: Prisma.SelectSubset<T, UsageAnalyticsFindFirstArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first UsageAnalytics that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsFindFirstOrThrowArgs} args - Arguments to find a UsageAnalytics
     * @example
     * // Get one UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UsageAnalyticsFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UsageAnalyticsFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more UsageAnalytics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.findMany()
     *
     * // Get first 10 UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const usageAnalyticsWithIdOnly = await prisma.usageAnalytics.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UsageAnalyticsFindManyArgs>(args?: Prisma.SelectSubset<T, UsageAnalyticsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a UsageAnalytics.
     * @param {UsageAnalyticsCreateArgs} args - Arguments to create a UsageAnalytics.
     * @example
     * // Create one UsageAnalytics
     * const UsageAnalytics = await prisma.usageAnalytics.create({
     *   data: {
     *     // ... data to create a UsageAnalytics
     *   }
     * })
     *
     */
    create<T extends UsageAnalyticsCreateArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsCreateArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many UsageAnalytics.
     * @param {UsageAnalyticsCreateManyArgs} args - Arguments to create many UsageAnalytics.
     * @example
     * // Create many UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UsageAnalyticsCreateManyArgs>(args?: Prisma.SelectSubset<T, UsageAnalyticsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many UsageAnalytics and returns the data saved in the database.
     * @param {UsageAnalyticsCreateManyAndReturnArgs} args - Arguments to create many UsageAnalytics.
     * @example
     * // Create many UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many UsageAnalytics and only return the `id`
     * const usageAnalyticsWithIdOnly = await prisma.usageAnalytics.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UsageAnalyticsCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UsageAnalyticsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a UsageAnalytics.
     * @param {UsageAnalyticsDeleteArgs} args - Arguments to delete one UsageAnalytics.
     * @example
     * // Delete one UsageAnalytics
     * const UsageAnalytics = await prisma.usageAnalytics.delete({
     *   where: {
     *     // ... filter to delete one UsageAnalytics
     *   }
     * })
     *
     */
    delete<T extends UsageAnalyticsDeleteArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsDeleteArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one UsageAnalytics.
     * @param {UsageAnalyticsUpdateArgs} args - Arguments to update one UsageAnalytics.
     * @example
     * // Update one UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UsageAnalyticsUpdateArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsUpdateArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more UsageAnalytics.
     * @param {UsageAnalyticsDeleteManyArgs} args - Arguments to filter UsageAnalytics to delete.
     * @example
     * // Delete a few UsageAnalytics
     * const { count } = await prisma.usageAnalytics.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UsageAnalyticsDeleteManyArgs>(args?: Prisma.SelectSubset<T, UsageAnalyticsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more UsageAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UsageAnalyticsUpdateManyArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more UsageAnalytics and returns the data updated in the database.
     * @param {UsageAnalyticsUpdateManyAndReturnArgs} args - Arguments to update many UsageAnalytics.
     * @example
     * // Update many UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more UsageAnalytics and only return the `id`
     * const usageAnalyticsWithIdOnly = await prisma.usageAnalytics.updateManyAndReturn({
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
    updateManyAndReturn<T extends UsageAnalyticsUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one UsageAnalytics.
     * @param {UsageAnalyticsUpsertArgs} args - Arguments to update or create a UsageAnalytics.
     * @example
     * // Update or create a UsageAnalytics
     * const usageAnalytics = await prisma.usageAnalytics.upsert({
     *   create: {
     *     // ... data to create a UsageAnalytics
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UsageAnalytics we want to update
     *   }
     * })
     */
    upsert<T extends UsageAnalyticsUpsertArgs>(args: Prisma.SelectSubset<T, UsageAnalyticsUpsertArgs<ExtArgs>>): Prisma.Prisma__UsageAnalyticsClient<runtime.Types.Result.GetResult<Prisma.$UsageAnalyticsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of UsageAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsCountArgs} args - Arguments to filter UsageAnalytics to count.
     * @example
     * // Count the number of UsageAnalytics
     * const count = await prisma.usageAnalytics.count({
     *   where: {
     *     // ... the filter for the UsageAnalytics we want to count
     *   }
     * })
    **/
    count<T extends UsageAnalyticsCountArgs>(args?: Prisma.Subset<T, UsageAnalyticsCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UsageAnalyticsCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a UsageAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends UsageAnalyticsAggregateArgs>(args: Prisma.Subset<T, UsageAnalyticsAggregateArgs>): Prisma.PrismaPromise<GetUsageAnalyticsAggregateType<T>>;
    /**
     * Group by UsageAnalytics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageAnalyticsGroupByArgs} args - Group by arguments.
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
    groupBy<T extends UsageAnalyticsGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UsageAnalyticsGroupByArgs['orderBy'];
    } : {
        orderBy?: UsageAnalyticsGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UsageAnalyticsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUsageAnalyticsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the UsageAnalytics model
     */
    readonly fields: UsageAnalyticsFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for UsageAnalytics.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__UsageAnalyticsClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    project<T extends Prisma.ProjectDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ProjectDefaultArgs<ExtArgs>>): Prisma.Prisma__ProjectClient<runtime.Types.Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the UsageAnalytics model
 */
export interface UsageAnalyticsFieldRefs {
    readonly id: Prisma.FieldRef<"UsageAnalytics", 'String'>;
    readonly projectId: Prisma.FieldRef<"UsageAnalytics", 'String'>;
    readonly totalRequests: Prisma.FieldRef<"UsageAnalytics", 'Int'>;
    readonly successfulRequests: Prisma.FieldRef<"UsageAnalytics", 'Int'>;
    readonly failedRequests: Prisma.FieldRef<"UsageAnalytics", 'Int'>;
    readonly totalTokens: Prisma.FieldRef<"UsageAnalytics", 'Int'>;
    readonly totalCost: Prisma.FieldRef<"UsageAnalytics", 'Decimal'>;
    readonly month: Prisma.FieldRef<"UsageAnalytics", 'Int'>;
    readonly year: Prisma.FieldRef<"UsageAnalytics", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"UsageAnalytics", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"UsageAnalytics", 'DateTime'>;
}
/**
 * UsageAnalytics findUnique
 */
export type UsageAnalyticsFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * Filter, which UsageAnalytics to fetch.
     */
    where: Prisma.UsageAnalyticsWhereUniqueInput;
};
/**
 * UsageAnalytics findUniqueOrThrow
 */
export type UsageAnalyticsFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * Filter, which UsageAnalytics to fetch.
     */
    where: Prisma.UsageAnalyticsWhereUniqueInput;
};
/**
 * UsageAnalytics findFirst
 */
export type UsageAnalyticsFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * Filter, which UsageAnalytics to fetch.
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UsageAnalytics to fetch.
     */
    orderBy?: Prisma.UsageAnalyticsOrderByWithRelationInput | Prisma.UsageAnalyticsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UsageAnalytics.
     */
    cursor?: Prisma.UsageAnalyticsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UsageAnalytics from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UsageAnalytics.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UsageAnalytics.
     */
    distinct?: Prisma.UsageAnalyticsScalarFieldEnum | Prisma.UsageAnalyticsScalarFieldEnum[];
};
/**
 * UsageAnalytics findFirstOrThrow
 */
export type UsageAnalyticsFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * Filter, which UsageAnalytics to fetch.
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UsageAnalytics to fetch.
     */
    orderBy?: Prisma.UsageAnalyticsOrderByWithRelationInput | Prisma.UsageAnalyticsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UsageAnalytics.
     */
    cursor?: Prisma.UsageAnalyticsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UsageAnalytics from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UsageAnalytics.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UsageAnalytics.
     */
    distinct?: Prisma.UsageAnalyticsScalarFieldEnum | Prisma.UsageAnalyticsScalarFieldEnum[];
};
/**
 * UsageAnalytics findMany
 */
export type UsageAnalyticsFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * Filter, which UsageAnalytics to fetch.
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UsageAnalytics to fetch.
     */
    orderBy?: Prisma.UsageAnalyticsOrderByWithRelationInput | Prisma.UsageAnalyticsOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing UsageAnalytics.
     */
    cursor?: Prisma.UsageAnalyticsWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UsageAnalytics from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UsageAnalytics.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UsageAnalytics.
     */
    distinct?: Prisma.UsageAnalyticsScalarFieldEnum | Prisma.UsageAnalyticsScalarFieldEnum[];
};
/**
 * UsageAnalytics create
 */
export type UsageAnalyticsCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * The data needed to create a UsageAnalytics.
     */
    data: Prisma.XOR<Prisma.UsageAnalyticsCreateInput, Prisma.UsageAnalyticsUncheckedCreateInput>;
};
/**
 * UsageAnalytics createMany
 */
export type UsageAnalyticsCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many UsageAnalytics.
     */
    data: Prisma.UsageAnalyticsCreateManyInput | Prisma.UsageAnalyticsCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * UsageAnalytics createManyAndReturn
 */
export type UsageAnalyticsCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * The data used to create many UsageAnalytics.
     */
    data: Prisma.UsageAnalyticsCreateManyInput | Prisma.UsageAnalyticsCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * UsageAnalytics update
 */
export type UsageAnalyticsUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * The data needed to update a UsageAnalytics.
     */
    data: Prisma.XOR<Prisma.UsageAnalyticsUpdateInput, Prisma.UsageAnalyticsUncheckedUpdateInput>;
    /**
     * Choose, which UsageAnalytics to update.
     */
    where: Prisma.UsageAnalyticsWhereUniqueInput;
};
/**
 * UsageAnalytics updateMany
 */
export type UsageAnalyticsUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update UsageAnalytics.
     */
    data: Prisma.XOR<Prisma.UsageAnalyticsUpdateManyMutationInput, Prisma.UsageAnalyticsUncheckedUpdateManyInput>;
    /**
     * Filter which UsageAnalytics to update
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * Limit how many UsageAnalytics to update.
     */
    limit?: number;
};
/**
 * UsageAnalytics updateManyAndReturn
 */
export type UsageAnalyticsUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * The data used to update UsageAnalytics.
     */
    data: Prisma.XOR<Prisma.UsageAnalyticsUpdateManyMutationInput, Prisma.UsageAnalyticsUncheckedUpdateManyInput>;
    /**
     * Filter which UsageAnalytics to update
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * Limit how many UsageAnalytics to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * UsageAnalytics upsert
 */
export type UsageAnalyticsUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * The filter to search for the UsageAnalytics to update in case it exists.
     */
    where: Prisma.UsageAnalyticsWhereUniqueInput;
    /**
     * In case the UsageAnalytics found by the `where` argument doesn't exist, create a new UsageAnalytics with this data.
     */
    create: Prisma.XOR<Prisma.UsageAnalyticsCreateInput, Prisma.UsageAnalyticsUncheckedCreateInput>;
    /**
     * In case the UsageAnalytics was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.UsageAnalyticsUpdateInput, Prisma.UsageAnalyticsUncheckedUpdateInput>;
};
/**
 * UsageAnalytics delete
 */
export type UsageAnalyticsDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
    /**
     * Filter which UsageAnalytics to delete.
     */
    where: Prisma.UsageAnalyticsWhereUniqueInput;
};
/**
 * UsageAnalytics deleteMany
 */
export type UsageAnalyticsDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which UsageAnalytics to delete
     */
    where?: Prisma.UsageAnalyticsWhereInput;
    /**
     * Limit how many UsageAnalytics to delete.
     */
    limit?: number;
};
/**
 * UsageAnalytics without action
 */
export type UsageAnalyticsDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageAnalytics
     */
    select?: Prisma.UsageAnalyticsSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UsageAnalytics
     */
    omit?: Prisma.UsageAnalyticsOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UsageAnalyticsInclude<ExtArgs> | null;
};
//# sourceMappingURL=UsageAnalytics.d.ts.map