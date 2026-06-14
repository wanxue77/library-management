package com.library.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;

@Data
public class BorrowRequestDTO {
    @NotNull(message = "图书ID不能为空")
    private Long bookId;
}
