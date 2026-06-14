package com.library.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.utils.Result;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class AdminInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }
        String role = (String) request.getAttribute("role");
        if ("ADMIN".equals(role)) {
            return true;
        }
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(403);
        response.getWriter().write(new ObjectMapper().writeValueAsString(Result.error(403, "权限不足，仅管理员可操作")));
        return false;
    }
}
