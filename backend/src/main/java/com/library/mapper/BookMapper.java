package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.Book;
import org.apache.ibatis.annotations.Update;

public interface BookMapper extends BaseMapper<Book> {

    @Update("UPDATE book SET available = available + #{delta}, update_time = CURRENT_TIMESTAMP WHERE id = #{bookId} AND available + #{delta} >= 0")
    int updateAvailable(Long bookId, int delta);
}
