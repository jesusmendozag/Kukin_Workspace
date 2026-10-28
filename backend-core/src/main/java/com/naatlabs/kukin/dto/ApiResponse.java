package com.naatlabs.kukin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private String status = "success";
    private T data;
    private Meta meta;

    public ApiResponse(T data) {
        this.data = data;
    }

    public ApiResponse(T data, Meta meta) {
        this.data = data;
        this.meta = meta;
    }

    public static class Meta {
        private int page;
        private int limit;
        private long total;

        public Meta(int page, int limit, long total) {
            this.page = page;
            this.limit = limit;
            this.total = total;
        }
        public int getPage() { return page; }
        public int getLimit() { return limit; }
        public long getTotal() { return total; }
    }

    public String getStatus() { return status; }
    public T getData() { return data; }
    public Meta getMeta() { return meta; }
}